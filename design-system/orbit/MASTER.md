# ORBIT Design System — MASTER

Source of truth for ORBIT's visual language. Derived with the **UI/UX Pro Max** skill
(`.claude/skills/ui-ux-pro-max`) and adapted to the brand. Page-specific overrides go in `pages/<page>.md`.

## How this was derived (skill queries actually run)

| Query | Result used | Decision |
|---|---|---|
| `"travel companion gamified packing checklist adventure" --design-system` | Travel/Tourism palette (sky `#0EA5E9`, adventure orange accent, bg `#F0F9FF`, muted `#475569`); style **Aurora UI**; pre-delivery checklist | Adopted palette direction + Aurora for hero surfaces only |
| same (typography part) | Orbitron + JetBrains Mono ("cyberpunk, neon") | **Rejected** — wrong mood for a friendly travel companion; re-queried |
| `"friendly playful rounded travel" --domain typography` | **Playful Creative: Fredoka + Nunito** | Adopted |
| `"modern geometric friendly premium app" --domain typography` | DM Sans / Outfit / Poppins | Considered; less playful than the mascot-led brand needs |
| `"progress achievement gamification" --domain ux` | Progress indicators (step X of Y) | Trip setup stepper |
| `"checkbox completion feedback animation" --domain ux` | Continuous animation only for loaders | Mascot loops only in idle/thinking; everything else plays once |
| `"celebration confetti reduced motion" --domain ux` | Respect reduced motion; animate 1–2 key elements per view | Confetti only for major milestones; `MotionConfig reducedMotion="user"` |
| `--stack react`, `--stack html-tailwind` | Label form controls; `focus-visible` rings; `motion-reduce` | Applied across forms and shared CSS |

## Colour tokens (`src/index.css` `@theme`)

| Token | Hex | Use |
|---|---|---|
| navy | `#0B1D33` | Headings, selected surfaces, dark heroes |
| sky / sky-600 | `#0EA5E9` / `#0369A1` | Interactive fills / interactive **text** (5.9:1) |
| orange / -600 / -700 | `#FF8A4C` / `#F2731F` / `#B3470C` | Primary CTA fill (navy text 7.3:1) / hover / orange **text** |
| mint / mint-700 | `#2DD4BF` / `#0F766E` | XP, progress, rewards / mint **text** |
| cream / cream-200 | `#F3F8FC` / `#E3EEF7` | Page background (cool mist) / subtle panels |
| success-700, danger | `#047857`, `#C53030` | Status text / destructive actions |
| muted | `#475569` | Secondary text (7.1:1 on background) |

Rule: base shades are for fills and icons; `-600/-700` shades are for text on light surfaces.
All text pairs were checked at ≥ 4.5:1.

## Typography
- **DM Sans** for headings and body — UI/UX Pro Max "Premium Sans" pairing, chosen by the product owner
  (replaced Fredoka + Nunito on 2026-10-11). Weights per the skill: 400 / 500 / 700 only —
  headings 700, body 400, labels 500; hierarchy comes from weight + a consistent size scale.
- Headings use `text-wrap: balance`; body ≥ 15px; no text under 12px.

## Shape, depth, spacing
- Radius: cards `rounded-3xl`, heroes `rounded-[2rem]`, controls `rounded-full` / `rounded-xl`.
- Elevation: `shadow-card` (resting), `shadow-lift` (hover/overlays), navy-tinted.
- Touch targets ≥ 44px on phones (`h-11`), compact `sm:h-9` from 640px.

## Motion
- Aurora gradient drift (12s) on hero surfaces only; static under reduced motion.
- One focal animated element per view (Orbi). Loops only while idle/thinking.
- Rewards: inline `+XP` pop; toasts for badges/levels; confetti only for level-up and 100%.
- `MotionConfig reducedMotion="user"` + CSS `prefers-reduced-motion` overrides.

## Calls to action
- One orange primary CTA per screen; navy (`dark`) for secondary emphasis; white outline for tertiary.
- Destructive confirmations use the `danger` variant.

## Mascot — Orbi
Hand-built SVG suitcase (`src/components/mascot/Mascot.jsx`). States: idle, welcome, thinking,
reminder, success, levelup, ready. Messages come from real checklist state (`src/lib/companion.js`)
and never claim legal readiness.

## Update 2026-10-12 — visual reference: "Finance Management Dashboard" (Bogdan Falin / QClay, Dribbble)
Product owner asked to follow this reference. UI/UX Pro Max match: **Minimalism & Swiss Style**
(no shadows/gradients, grid-based, high contrast, clean borders). Supersedes the colour table above:

| Token | Hex | Use |
|---|---|---|
| navy (ink) | `#141414` | Text, black pill buttons, selected nav/chips |
| orange (coral) / -600 / -700 / -50 | `#C9441F` / `#B23A18` / `#BF3F1C` / `#FDEEE9` | Single accent: primary CTA (white text 4.85:1), coral text, tints |
| mint (bright coral) | `#E8603C` | Progress/XP fills (ink text on it) |
| sky / sky-600 / sky-50 | `#1F1F1F` / `#141414` / `#F1F1F1` | Former blue accents resolve to ink |
| cream / cream-200 | `#F4F4F4` / `#EAEAEA` | Canvas / subtle panels |
| muted | `#666666` | Secondary text (5.2:1 on canvas) |

- Heroes: flat white `hero-surface` cards (the dark Aurora gradient was removed).
- Depth: hairline `0 0 0 1px` borders instead of shadows; headings DM Sans 500.
- The reference's coral `#E8603C` is too light for white text, so CTAs use the deeper `#C9441F`.
