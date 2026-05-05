import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push';

// ── Cascade logic (mirrors src/utils/recordCascadeLogic.js) ──────────────────

const timeToMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const SEGMENTS = [
  { zone: 'Extra', start: 0,       end: 8 * 60,        nextAuto: 8 * 60 },
  { zone: 'Manhã', start: 8 * 60,  end: 12 * 60,       nextAuto: null },
  { zone: 'Tarde', start: 13 * 60, end: 17 * 60,       nextAuto: 17 * 60 },
  { zone: 'Extra', start: 17 * 60, end: 23 * 60 + 30,  nextAuto: null },
];

const applyAutoCloseRules = (openTimeStr: string) => {
  const result: { turno: string; horaInicioEscolhido: string; horaFimEscolhido: string }[] = [];
  let current: number | null = timeToMinutes(openTimeStr);

  while (current !== null) {
    const seg = SEGMENTS.find(s => current! >= s.start && current! < s.end);
    if (!seg) break;
    result.push({
      turno: seg.zone,
      horaInicioEscolhido: minutesToTime(current),
      horaFimEscolhido: minutesToTime(seg.end),
    });
    current = seg.nextAuto;
  }
  return result;
};

// ── Date helpers (match client's getLocalISOString — Lisbon local time) ───────

const lisbonDateParts = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Lisbon',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date);

const lisbonISO = (date: Date): string => {
  const p = lisbonDateParts(date);
  const g = (t: string) => p.find(x => x.type === t)?.value ?? '00';
  return `${g('year')}-${g('month')}-${g('day')}T${g('hour')}:${g('minute')}:${g('second')}`;
};

// Apply a HH:MM time to the date portion of a Lisbon ISO string
const applyTime = (baseLisbonISO: string, timeStr: string): string =>
  `${baseLisbonISO.split('T')[0]}T${timeStr}:00`;

// ── Main handler ──────────────────────────────────────────────────────────────

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Guard: only run at 23:30 Lisbon time
  const now = new Date();
  const parts = lisbonDateParts(now);
  const g = (t: string) => parseInt(parts.find(x => x.type === t)?.value ?? '0');
  if (g('hour') !== 23 || g('minute') !== 30) {
    return new Response('Not 23:30 Lisbon', { status: 200, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails('mailto:admin@manteivias.com', vapidPublicKey, vapidPrivateKey);
  }

  // Fetch all open records
  const { data: openRecords, error: fetchErr } = await supabase
    .from('registros_ponto')
    .select('*')
    .is('hora_fim_real', null)
    .neq('status_validacao', 'Cancelado');

  if (fetchErr) {
    console.error('[auto-close-cron] Fetch error:', fetchErr);
    return new Response('Fetch error', { status: 500 });
  }

  if (!openRecords?.length) {
    return new Response('No open records', { status: 200 });
  }

  let closedCount = 0;

  for (const record of openRecords) {
    if (!record.hora_inicio_escolhido) continue;

    const cascade = applyAutoCloseRules(record.hora_inicio_escolhido);
    if (cascade.length === 0) continue;

    // Verify the last cascade close time is actually in the past (≤ 23:30)
    const lastClose = timeToMinutes(cascade[cascade.length - 1].horaFimEscolhido);
    const nowMins = g('hour') * 60 + g('minute');
    if (lastClose > nowMins) continue;

    const baseDate = lisbonISO(new Date(record.hora_inicio_real));

    const insertions = cascade.map((seg, i) => ({
      usuario_id:           record.usuario_id,
      obra_id:              record.obra_id,
      lat_inicio:           record.lat_inicio,
      lon_inicio:           record.lon_inicio,
      lat_fim:              null,
      lon_fim:              null,
      distancia_metros:     record.distancia_metros,
      dentro_raio_500m:     record.dentro_raio_500m,
      status_validacao:     'Fechado Automaticamente',
      turno:                seg.turno,
      hora_inicio_escolhido: seg.horaInicioEscolhido,
      hora_fim_escolhido:   seg.horaFimEscolhido,
      hora_inicio_real:     i === 0 ? record.hora_inicio_real : applyTime(baseDate, seg.horaInicioEscolhido),
      hora_fim_real:        applyTime(baseDate, seg.horaFimEscolhido),
    }));

    const { error: delErr } = await supabase
      .from('registros_ponto')
      .delete()
      .eq('id', record.id);

    if (delErr) {
      console.error(`[auto-close-cron] Delete failed for ${record.id}:`, delErr);
      continue;
    }

    const { error: insErr } = await supabase
      .from('registros_ponto')
      .insert(insertions);

    if (insErr) {
      console.error(`[auto-close-cron] Insert failed for ${record.id}:`, insErr);
      continue;
    }

    closedCount++;

    // Notify the user via push if subscribed
    if (vapidPublicKey && vapidPrivateKey) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('endpoint, p256dh, auth')
        .eq('user_id', record.usuario_id);

      for (const sub of subs ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({
              title: 'Registo Fechado Automaticamente',
              message: 'Um registo seu foi fechado automaticamente às 23:30.',
            }),
          );
        } catch (e: any) {
          if (e.statusCode === 410 || e.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
        }
      }
    }
  }

  console.log(`[auto-close-cron] Closed ${closedCount} record(s).`);
  return new Response(`Closed ${closedCount} record(s)`, { status: 200, headers: corsHeaders });
});
