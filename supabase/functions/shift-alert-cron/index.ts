import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push';

const SHIFT_ALERTS = [
  {
    hour: 8, minute: 0, tag: 'shift-alert-8am',
    check: (records: any[]) => records.length === 0
      ? { title: 'Turno da Manhã', message: 'Não registrou entrada no turno da manhã.' }
      : null,
  },
  {
    hour: 12, minute: 0, tag: 'shift-alert-12pm',
    check: (records: any[]) => {
      const openManha = records.find((r) => (r.turno === 'Manhã' || r.turno === 'Manha') && !r.hora_fim_real);
      return openManha
        ? { title: 'Turno da Manhã', message: 'Registre sua saída da manhã e entrada da tarde.' }
        : null;
    },
  },
  {
    hour: 13, minute: 0, tag: 'shift-alert-1pm',
    check: (records: any[]) => {
      const closedManha = records.find((r) => (r.turno === 'Manhã' || r.turno === 'Manha') && r.hora_fim_real);
      const hasTarde = records.find((r) => r.turno === 'Tarde');
      return closedManha && !hasTarde
        ? { title: 'Turno da Tarde', message: 'Não registrou entrada no turno da tarde.' }
        : null;
    },
  },
  {
    hour: 17, minute: 0, tag: 'shift-alert-5pm',
    check: (records: any[]) => {
      const openTarde = records.find((r) => r.turno === 'Tarde' && !r.hora_fim_real);
      return openTarde
        ? { title: 'Turno da Tarde', message: 'Registre sua saída da tarde.' }
        : null;
    },
  },
  {
    hour: 17, minute: 0, tag: 'shift-alert-extra',
    check: (records: any[]) => {
      const hasAnyOpen = records.find((r) => !r.hora_fim_real);
      return hasAnyOpen
        ? { title: 'Turno extra iniciado', message: 'Rodando até 23:30 e será fechado automaticamente.' }
        : null;
    },
  },
  {
    hour: 20, minute: 0, tag: 'shift-alert-8pm',
    check: (records: any[]) => {
      const hasOpen = records.find((r) => !r.hora_fim_real);
      return hasOpen
        ? { title: 'Registos em Aberto', message: 'Você tem registros abertos que precisam ser fechados.' }
        : null;
    },
  },
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response('VAPID keys not configured', { status: 500, headers: corsHeaders });
  }

  // Get current time in Europe/Lisbon (handles DST automatically)
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Lisbon',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now);

  const currentHour = parseInt(parts.find((p) => p.type === 'hour')!.value);
  const currentMinute = parseInt(parts.find((p) => p.type === 'minute')!.value);

  const matchingAlerts = SHIFT_ALERTS.filter(
    (a) => a.hour === currentHour && a.minute === currentMinute,
  );
  if (matchingAlerts.length === 0) {
    return new Response('No alerts at this time', { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  webpush.setVapidDetails(
    'mailto:admin@manteivias.com',
    vapidPublicKey,
    vapidPrivateKey,
  );

  const todayLisbon = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Lisbon',
  }).format(now);
  const startOfDay = `${todayLisbon}T00:00:00`;
  const endOfDay = `${todayLisbon}T23:59:59`;

  const { data: subscriptions, error: subError } = await supabase
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');

  if (subError || !subscriptions?.length) {
    return new Response('No subscriptions', { status: 200, headers: corsHeaders });
  }

  for (const sub of subscriptions) {
    const { data: records } = await supabase
      .from('registros_ponto')
      .select('id, turno, hora_inicio_real, hora_fim_real')
      .eq('usuario_id', sub.user_id)
      .gte('hora_inicio_real', startOfDay)
      .lte('hora_inicio_real', endOfDay)
      .neq('status_validacao', 'Cancelado');

    for (const alert of matchingAlerts) {
      const fireKey = `${alert.tag}-${todayLisbon}-${sub.user_id}`;

      const { data: existing } = await supabase
        .from('shift_alert_log')
        .select('id')
        .eq('fire_key', fireKey)
        .maybeSingle();

      if (existing) continue;

      const notification = alert.check(records || []);
      if (!notification) continue;

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: notification.title, message: notification.message }),
        );

        await supabase.from('shift_alert_log').insert({
          fire_key: fireKey,
          fired_at: now.toISOString(),
        });
      } catch (e: any) {
        // Subscription expired or invalid — remove it
        if (e.statusCode === 410 || e.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        } else {
          console.error(`[shift-alert-cron] Push failed for ${sub.user_id}:`, e.message);
        }
      }
    }
  }

  return new Response('OK', { status: 200, headers: corsHeaders });
});
