-- Reminders and checklist updates now go out as push notifications; WhatsApp is no longer used.
-- Keep reminders on only for trips whose owner had opted in, then delete the phone numbers and consent records.
UPDATE notification_prefs
   SET reminders_enabled = consent,
       updates_enabled = CASE WHEN consent = 1 THEN updates_enabled ELSE 0 END;

UPDATE jobs SET status = 'cancelled'
 WHERE status = 'pending'
   AND trip_id IN (SELECT trip_id FROM notification_prefs WHERE reminders_enabled = 0);

-- Old WhatsApp message history (contains masked numbers) is no longer shown anywhere
DELETE FROM message_log WHERE provider <> 'webpush';

ALTER TABLE notification_prefs DROP COLUMN whatsapp_e164;
ALTER TABLE notification_prefs DROP COLUMN consent;
ALTER TABLE notification_prefs DROP COLUMN consent_at;
ALTER TABLE notification_prefs DROP COLUMN consent_text;
