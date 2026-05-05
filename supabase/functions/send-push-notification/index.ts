import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push';

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!vapidPublicKey || !vapidPrivateKey) {
    return new Response(JSON.stringify({ error: 'VAPID keys not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { userId?: string; user_ids?: string[]; title: string; message: string; data?: Record<string, string> };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { userId, user_ids, title, message, data } = body;

  if (!title || !message) {
    return new Response(JSON.stringify({ error: 'title and message are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Accept either userId (single) or user_ids (array), coerce to numbers
  const rawTargets: string[] = user_ids ?? (userId ? [userId] : []);
  const targets = rawTargets.map(id => Number(id));
  if (targets.length === 0) {
    return new Response(JSON.stringify({ error: 'userId or user_ids required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  webpush.setVapidDetails('mailto:admin@manteivias.com', vapidPublicKey, vapidPrivateKey);

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: subs, error: subError } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .in('user_id', targets);

  if (subError) {
    return new Response(JSON.stringify({ error: subError.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!subs?.length) {
    return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions found' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const payload = JSON.stringify({ title, message, data: data ?? {} });
  let sent = 0;

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (e: any) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      } else {
        console.error('[send-push-notification] Push failed:', e.message);
      }
    }
  }

  return new Response(JSON.stringify({ sent }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
