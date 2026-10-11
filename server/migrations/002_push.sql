-- Web push subscriptions: the backup channel when WhatsApp can't deliver a reminder or update.
-- One row per browser/device; push services remove expired ones (404/410) and we delete them too.
CREATE TABLE push_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_push_user ON push_subscriptions(user_id);
