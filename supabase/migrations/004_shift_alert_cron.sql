-- Table to prevent double-firing of shift alerts
CREATE TABLE IF NOT EXISTS shift_alert_log (
  id        BIGSERIAL PRIMARY KEY,
  fire_key  TEXT UNIQUE NOT NULL,
  fired_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-cleanup entries older than 2 days (keeps the table small)
CREATE INDEX IF NOT EXISTS idx_shift_alert_log_fired_at ON shift_alert_log (fired_at);

-- pg_cron: run shift-alert-cron every minute
-- The Edge Function handles timezone (Europe/Lisbon) and returns fast when no alert matches.
SELECT cron.schedule(
  'shift-alert-cron',
  '* * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://habwmiaiahevujwmfxoh.supabase.co/functions/v1/shift-alert-cron',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Cleanup job: remove log entries older than 2 days (runs daily at 01:00 Lisbon = 01:00 UTC winter / 00:00 UTC summer)
SELECT cron.schedule(
  'shift-alert-log-cleanup',
  '0 1 * * *',
  $$DELETE FROM shift_alert_log WHERE fired_at < NOW() - INTERVAL '2 days'$$
);
