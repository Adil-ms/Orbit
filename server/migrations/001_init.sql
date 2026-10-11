-- ORBIT "Did I Forget Something?" — initial schema

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  display_name TEXT,
  created_at INTEGER NOT NULL
);

-- Opaque session tokens; only the SHA-256 hash is stored
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

CREATE TABLE trips (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  destination_city TEXT NOT NULL,
  destination_country TEXT NOT NULL,      -- ISO 3166-1 alpha-2
  purpose TEXT NOT NULL,
  departure_local TEXT NOT NULL,          -- 'YYYY-MM-DDTHH:MM' wall-clock time
  departure_tz TEXT NOT NULL,             -- IANA zone the wall-clock time is in
  departure_at INTEGER NOT NULL,          -- UTC epoch ms, derived from the two above
  checklist_source TEXT NOT NULL,         -- 'rules' | 'rules+ai'
  ai_model TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_trips_user ON trips(user_id, departure_at);

CREATE TABLE checklist_items (
  id TEXT PRIMARY KEY,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  note TEXT,
  importance TEXT NOT NULL,               -- critical | high | normal | optional
  kind TEXT NOT NULL DEFAULT 'item',      -- item | requirement (entry/legal requirement to confirm)
  applicable INTEGER NOT NULL DEFAULT 1,
  applicability_note TEXT,
  requirement_status TEXT,                -- unverified | verified (requirements only)
  verified_at INTEGER,
  source_url TEXT,
  source_label TEXT,
  source_added_on TEXT,                   -- date the link was added to ORBIT's source list
  origin TEXT NOT NULL,                   -- rules | ai | user
  completed INTEGER NOT NULL DEFAULT 0,
  completed_at INTEGER,
  position INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_items_trip ON checklist_items(trip_id, category, position);

-- Append-only XP ledger. UNIQUE(event_key) per user makes every award idempotent.
CREATE TABLE xp_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id TEXT,
  event_key TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (user_id, event_key)
);
CREATE INDEX idx_xp_trip ON xp_ledger(trip_id);

CREATE TABLE achievements (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  trip_id TEXT,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
);

CREATE TABLE activity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id TEXT,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_activity_user ON activity(user_id, created_at);

CREATE TABLE notification_prefs (
  trip_id TEXT PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  whatsapp_e164 TEXT,
  consent INTEGER NOT NULL DEFAULT 0,
  consent_at INTEGER,
  consent_text TEXT,
  reminders_enabled INTEGER NOT NULL DEFAULT 1,
  updates_enabled INTEGER NOT NULL DEFAULT 0,
  offsets_hours TEXT NOT NULL DEFAULT '24,3',
  updated_at INTEGER NOT NULL
);

-- Durable job queue for reminders / batched checklist updates
CREATE TABLE jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  kind TEXT NOT NULL,                     -- reminder | update
  dedupe_key TEXT NOT NULL UNIQUE,
  run_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | running | sent | failed | cancelled | skipped
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 4,
  last_error TEXT,
  payload TEXT,
  locked_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_jobs_due ON jobs(status, run_at);

-- What we sent and what the provider told us. "delivered" only ever comes from a provider webhook.
CREATE TABLE message_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER REFERENCES jobs(id) ON DELETE SET NULL,
  trip_id TEXT REFERENCES trips(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,                 -- cloud | mock
  provider_message_id TEXT,
  to_masked TEXT NOT NULL,
  kind TEXT NOT NULL,
  body_preview TEXT NOT NULL,
  status TEXT NOT NULL,                   -- mock | accepted | sent | delivered | read | failed
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_messages_provider_id ON message_log(provider_message_id);
