-- Corre este script no SQL Editor do Supabase para corrigir a autenticação dos cron jobs.
-- O current_setting('app.service_role_key') anterior retornava NULL → as edge functions
-- eram chamadas com header inválido → push notifications nunca disparavam em background.

-- Remove os jobs antigos e recria com a anon key (pública por design).
SELECT cron.unschedule('shift-alert-cron')  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'shift-alert-cron');
SELECT cron.unschedule('shift-alert-log-cleanup') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'shift-alert-log-cleanup');
SELECT cron.unschedule('auto-close-cron-summer') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-close-cron-summer');
SELECT cron.unschedule('auto-close-cron-winter') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'auto-close-cron-winter');

SELECT cron.schedule(
  'shift-alert-cron',
  '* * * * *',
  $$
    SELECT net.http_post(
      url     := 'https://habwmiaiahevujwmfxoh.supabase.co/functions/v1/shift-alert-cron',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYndtaWFpYWhldnVqd21meG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDUyNzYsImV4cCI6MjA2ODMyMTI3Nn0.jeJhITobvRdgMOzgakHLAX_qaFkzTFXQyT9_y22eJ2Y'
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);

SELECT cron.schedule(
  'shift-alert-log-cleanup',
  '0 1 * * *',
  $$DELETE FROM shift_alert_log WHERE fired_at < NOW() - INTERVAL '2 days'$$
);

SELECT cron.schedule(
  'auto-close-cron-summer',
  '30 22 * * *',
  $$
    SELECT net.http_post(
      url     := 'https://habwmiaiahevujwmfxoh.supabase.co/functions/v1/auto-close-cron',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYndtaWFpYWhldnVqd21meG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDUyNzYsImV4cCI6MjA2ODMyMTI3Nn0.jeJhITobvRdgMOzgakHLAX_qaFkzTFXQyT9_y22eJ2Y'
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
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhYndtaWFpYWhldnVqd21meG9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NDUyNzYsImV4cCI6MjA2ODMyMTI3Nn0.jeJhITobvRdgMOzgakHLAX_qaFkzTFXQyT9_y22eJ2Y'
      ),
      body    := '{}'::jsonb
    ) AS request_id;
  $$
);

-- Verifica os jobs activos:
SELECT jobname, schedule, command FROM cron.job;
