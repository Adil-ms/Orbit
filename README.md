# ORBIT

Travel companion web app with two experiences:

1. **Turn waiting time into an adventure** — find activities that fit the time before your departure (frontend-only, demo data).
2. **Did I Forget Something?** — create a trip, get a personalised preparation checklist, track your progress as you pack, and get WhatsApp reminders before you leave (React frontend + Node API).

## Quick start

```bash
npm install
cp .env.example .env        # optional — everything works with defaults
npm run dev:full            # API on :8787 + Vite on :5173 (proxying /api)
```

Or run them separately: `npm run server` and `npm run dev`.

| Script | What it does |
|---|---|
| `npm run dev:full` | API server (watch mode) + Vite dev server |
| `npm run server` | API server only (`server/index.js`) |
| `npm run build` | Production frontend build into `dist/` |
| `npm start` | API server; also serves `dist/` when it exists |
| `npm test` | Backend tests (`node --test`) |
| `npm run lint` | ESLint for frontend and server |

Requires Node.js **22.13+** (uses the built-in `node:sqlite`). Data is stored in `server/data/orbit.db`.

## Architecture

```
src/                     React 19 + Vite + Tailwind 4 + Zustand + Motion
  pages/TripsDashboard   /trips          dashboard (hero, progress, trips, badges, activity)
  pages/TripSetup        /trips/new      4-step trip setup
  pages/TripChecklist    /trips/:id      animated checklist
  pages/Profile          /profile        level, badge collection, scoring rules
  components/mascot      Orbi, the animated suitcase companion
  services/orbitApi.js   API client (cookie session, CSRF header, signed-link support)
server/                  Express 5 + node:sqlite
  migrations/            numbered SQL migrations (applied automatically on start)
  services/              checklist rules, AI, readiness, gamification, WhatsApp, scheduler, links
  tests/                 node:test suites
design-system/orbit/     design-system decisions (from UI/UX Pro Max)
```

## Environment variables

See `.env.example`. Nothing is required for local development.

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `8787` | API port |
| `APP_BASE_URL` | `http://localhost:5174` | Used to build links in WhatsApp messages |
| `LINK_SIGNING_SECRET` | random per process (dev) | **Required in production.** Signs trip links |
| `LINK_TTL_HOURS` | `72` | Lifetime of WhatsApp trip links |
| `ORBIT_DB_PATH` | `server/data/orbit.db` | SQLite file |
| `ANTHROPIC_API_KEY` | — | Enables AI checklist suggestions |
| `ORBIT_AI_MODEL` | `claude-opus-5-5` | Model for suggestions |
| `ORBIT_AI_EFFORT` | `medium` | Effort level for suggestions |
| `ORBIT_AI_ENABLED` | `true` | Set `false` to force rule-based checklists |
| `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` | — | WhatsApp Cloud API; without them messages run in **mock mode** |
| `WHATSAPP_TEMPLATE_REMINDER` / `_UPDATE` | `orbit_trip_reminder` / `orbit_checklist_update` | Approved template names |
| `WHATSAPP_TEMPLATE_LANGUAGE` | `en` | Template language code |
| `WHATSAPP_API_VERSION` | `v21.0` | Graph API version |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `WHATSAPP_APP_SECRET` | — | Webhook handshake + signature verification |
| `REMINDER_OFFSETS_HOURS` | `24,3` | Default reminder offsets |
| `UPDATE_BATCH_SECONDS` | `120` | Batching window for checklist-update messages |
| `ORBIT_SCORING_JSON` | — | Override XP values / anti-farming limits |

## AI checklist suggestions

The baseline checklist is deterministic (`server/services/checklistRules.js`). When `ANTHROPIC_API_KEY` is set,
Claude (`claude-opus-5-5` by default) adds up to 12 destination/purpose-specific suggestions using structured
outputs validated with Zod, with the server-side refusal fallback enabled. AI output is treated as untrusted:
links are stripped, duplicates removed, and anything framed as an entry requirement is stored as
**“needs confirmation”** — never as verified. If the AI call fails, the rule-based checklist is used.

## Accuracy rules for entry requirements

- ORBIT never states that a visa, permit or vaccination is (or isn’t) required.
- Passport/visa items are created as **requirements to confirm**, with a link to an official government portal
  when one is in `server/data/officialSources.js` (labelled with the date the link was added — not a verification date).
- Domestic trips mark passport/visa as *not applicable*, with the reason; users can switch them back.
- **Preparation score** (weighted checklist completion) and **requirement status** (how many requirements the
  traveller has confirmed) are shown separately. A 100% score is never labelled “legally ready”.

## Server-side reward ledger

The API still records these awards for future use, but the UI no longer shows XP, levels or badges.

| Action | XP |
|---|---:|
| Create a trip (max 5 per 30 days) | 50 |
| Complete an essential document item | 20 |
| Complete a regular item (own items: first 5 per trip) | 10 |
| Complete a whole category (2+ items) | 50 |
| Reach 50% / 100% completion (8+ item checklists) | 25 / 100 |
| Finish 24h+ before departure | 50 |

Levels: New Explorer (0) · Smart Packer (150) · Travel Planner (500) · Adventure Pro (1000) · Boarding Champion (1800) · Global Explorer (3000).

All awards are calculated on the server and recorded in an append-only ledger with `UNIQUE(user_id, event_key)`,
so re-checking items, retries or duplicate requests can never award twice. Badges are unlocked once each.

Readiness weights: critical 5 · high 3 · normal 2 · optional 1. Items marked *not needed* are excluded.

## WhatsApp setup (Cloud API)

1. Create a WhatsApp Business app in Meta for Developers; note the **phone number ID** and a **permanent access token**.
2. Register two **utility** message templates (business-initiated messages must use approved templates):

   **`orbit_trip_reminder`** — 5 body variables
   ```
   🧳 Did You Forget Something?

   Your trip to {{1}} is coming up!

   Your preparation score: {{2}}

   {{3}}

   You still have {{4}} items to check.

   Open your checklist: {{5}}

   Your adventure is almost ready! ✈️
   ```
   **`orbit_checklist_update`** — 4 body variables
   ```
   🎉 Checklist updated!

   {{1}}

   Preparation progress: {{2}} of {{3}} items

   Open your trip checklist: {{4}}

   Safe travels! ✈️
   ```
   (Meta rejects a template body that ends with a variable, hence the closing line.
   Template variables can’t contain line breaks, so the item list is sent as `Passport ✔️ · Flight ticket ✔️ · …`.
   If Meta rejects URLs inside body variables for your account, move the link to a URL button with a dynamic suffix.)
3. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and the template names.
4. Configure the webhook URL `https://<your-host>/api/webhooks/whatsapp` with `WHATSAPP_WEBHOOK_VERIFY_TOKEN`,
   subscribe to `messages`, and set `WHATSAPP_APP_SECRET` so delivery statuses are signature-verified.

Behaviour: reminders are scheduled server-side at the configured offsets (timezone-aware) in a durable SQLite
job queue; rapid checklist changes are batched into one update; transient failures retry with backoff (1m, 5m,
15m, 60m); permanent 4xx errors stop. A message is only shown as **delivered/read** when the provider’s webhook
says so. Messages never include health items, user-typed item names, or long numbers. Users must opt in per trip,
and turning WhatsApp off deletes the stored number and cancels pending jobs.

## Security notes

- Guest accounts: random session token in an httpOnly, SameSite=Lax cookie; only its SHA-256 hash is stored.
- CSRF: mutating requests require the `X-Orbit-Client: 1` header.
- Every trip/item operation checks ownership; WhatsApp links are HMAC-signed, expiring, single-trip capabilities.
- Input validation with Zod; in-memory rate limits (general, trip creation, item changes, preferences).
- No passport/ticket numbers are requested; item names with long digit runs are rejected client-side and masked in messages.

## Known limitations

- Accounts are per-browser guest sessions (no email login/cross-device sync yet).
- Rate limiting and the scheduler run in-process — use a shared store/queue if you scale to multiple instances.
- Destination autocomplete uses a built-in list (no external location service is configured).
