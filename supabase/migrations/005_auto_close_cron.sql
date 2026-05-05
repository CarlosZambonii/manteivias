-- Schedule auto-close-cron to run at both 22:30 UTC and 23:30 UTC.
-- The Edge Function guards internally: only executes when Lisbon clock shows 23:30,
-- so exactly one of these fires on the right day regardless of DST.
--   Winter (UTC+0): 23:30 Lisbon = 23:30 UTC  → second schedule fires
--   Summer (UTC+1): 23:30 Lisbon = 22:30 UTC  → first schedule fires

SELECT cron.schedule(
  'auto-close-cron-summer',
  '30 22 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://habwmiaiahevujwmfxoh.supabase.co/functions/v1/auto-close-cron',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);

SELECT cron.schedule(
  'auto-close-cron-winter',
  '30 23 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://habwmiaiahevujwmfxoh.supabase.co/functions/v1/auto-close-cron',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);
