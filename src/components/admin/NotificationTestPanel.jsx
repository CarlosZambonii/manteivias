import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, AlertCircle, CheckCircle, BellRing, UserCheck,
  Smartphone, Monitor, Clock, Info, Wifi, WifiOff
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationTestService } from '@/services/NotificationTestService';
import { NotificationService } from '@/services/NotificationService';
import { useToast } from '@/components/ui/use-toast';
import { isIOS, isSafari } from '@/utils/iosDetector';
import { supabase } from '@/lib/customSupabaseClient';

// ── Platform detection ────────────────────────────────────────────────────────

const getPlatformInfo = () => {
  const ios = isIOS();
  const safari = isSafari();
  const standalone = window.navigator.standalone === true
    || window.matchMedia('(display-mode: standalone)').matches;
  const isAndroid = /android/i.test(navigator.userAgent);
  const swSupported = 'serviceWorker' in navigator;
  const pushSupported = 'PushManager' in window;
  const notifSupported = 'Notification' in window;

  let platform = 'Desktop';
  if (ios) platform = 'iOS';
  else if (isAndroid) platform = 'Android';

  return { ios, safari, standalone, isAndroid, swSupported, pushSupported, notifSupported, platform };
};

// ── Alert schedule summary ────────────────────────────────────────────────────

const ALERT_SCHEDULE = [
  {
    time: '08:00',
    label: 'Manhã não registada',
    condition: 'Sem nenhum registo no dia',
    message: 'Não registrou entrada no turno da manhã.',
  },
  {
    time: '12:00',
    label: 'Saída da manhã em aberto',
    condition: 'Turno Manhã aberto (sem hora_fim_real)',
    message: 'Registre sua saída da manhã e entrada da tarde.',
  },
  {
    time: '13:00',
    label: 'Tarde não registada',
    condition: 'Manhã fechada mas sem registo de Tarde',
    message: 'Não registrou entrada no turno da tarde.',
  },
  {
    time: '17:00',
    label: 'Saída da tarde em aberto',
    condition: 'Turno Tarde aberto (sem hora_fim_real)',
    message: 'Registre sua saída da tarde.',
  },
  {
    time: '17:00',
    label: 'Turno extra iniciado',
    condition: 'Qualquer registo ainda aberto às 17h',
    message: 'Rodando até 23:30 e será fechado automaticamente.',
  },
  {
    time: '20:00',
    label: 'Registos em aberto',
    condition: 'Qualquer registo ainda aberto às 20h',
    message: 'Você tem registros abertos que precisam ser fechados.',
  },
  {
    time: '23:30',
    label: 'Fecho automático',
    condition: 'Qualquer registo em aberto no fim do dia',
    message: 'Registo fechado automaticamente pelo sistema.',
    isAutoClose: true,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

const StatusDot = ({ ok, label }) => (
  <div className="flex items-center gap-2 text-sm">
    {ok
      ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
      : <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
    <span className={ok ? '' : 'text-destructive'}>{label}</span>
  </div>
);

const ResultBadge = ({ result }) => {
  if (!result) return null;
  if (result.success) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-xs">
        <CheckCircle className="mr-1 h-3 w-3" />
        {result.data ? JSON.stringify(result.data) : 'OK'}
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="text-xs">
      <AlertCircle className="mr-1 h-3 w-3" />
      {result.error}
    </Badge>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const NotificationTestPanel = () => {
  const { user } = useAuth();
  const { permission, subscribe } = useNotifications();
  const [loading, setLoading] = useState({});
  const [results, setResults] = useState({});
  const [userStatus, setUserStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [platform] = useState(getPlatformInfo);
  const [vapidStatus, setVapidStatus] = useState(null);
  const { toast } = useToast();

  const fetchUserStatus = useCallback(async () => {
    if (!user) return;
    setStatusLoading(true);
    const s = await NotificationTestService.getUserTodayStatus(user.id);
    setUserStatus(s);
    setStatusLoading(false);
  }, [user]);

  useEffect(() => { fetchUserStatus(); }, [fetchUserStatus]);

  // Check VAPID key reachability on mount
  useEffect(() => {
    supabase.functions.invoke('get-vapid-public-key')
      .then(({ data, error }) => {
        setVapidStatus(error || !data?.publicKey ? 'error' : 'ok');
      })
      .catch(() => setVapidStatus('error'));
  }, []);

  const run = async (key, fn) => {
    setLoading(p => ({ ...p, [key]: true }));
    setResults(p => ({ ...p, [key]: null }));
    const result = await fn();
    setResults(p => ({ ...p, [key]: result }));
    setLoading(p => ({ ...p, [key]: false }));
    toast({
      title: result.success ? 'Sucesso' : 'Erro',
      description: result.success
        ? `Teste '${key}' concluído.`
        : `Erro: ${result.error}`,
      variant: result.success ? 'default' : 'destructive',
    });
    setTimeout(fetchUserStatus, 2000);
  };

  const TestRow = ({ id, label, description, fn }) => (
    <div className="flex items-center justify-between p-4 border-b last:border-b-0 gap-4">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        <div className="mt-2"><ResultBadge result={results[id]} /></div>
      </div>
      <Button size="sm" onClick={() => run(id, fn)} disabled={loading[id]} className="shrink-0">
        {loading[id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" />}
      </Button>
    </div>
  );

  const swRegistered = 'serviceWorker' in navigator;
  const iosNeedsPWA = platform.ios && !platform.standalone;
  const iosNeedsPermission = platform.ios && platform.standalone && permission !== 'granted';

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl mx-auto">

      {/* ── Plataforma ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            {platform.ios || platform.isAndroid
              ? <Smartphone className="h-5 w-5" />
              : <Monitor className="h-5 w-5" />}
            Plataforma — {platform.platform}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <StatusDot ok={platform.swSupported} label="Service Worker suportado" />
          <StatusDot ok={platform.pushSupported} label="Push API suportada" />
          <StatusDot ok={platform.notifSupported} label="Notification API disponível" />
          <StatusDot ok={vapidStatus === 'ok'} label={`Chave VAPID acessível${vapidStatus === null ? ' (a verificar…)' : ''}`} />
          {platform.ios && (
            <StatusDot ok={platform.standalone} label={platform.standalone ? 'App instalada (PWA standalone)' : 'App NÃO instalada — notificações push requerem instalação'} />
          )}
          {platform.ios && !platform.safari && (
            <StatusDot ok={false} label="iOS: use Safari para instalar e receber push" />
          )}

          {iosNeedsPWA && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-semibold">iOS — instalar como PWA</p>
              <p>1. Abre no Safari</p>
              <p>2. Toca em Partilhar <span className="font-mono">⬆</span></p>
              <p>3. "Adicionar ao ecrã principal"</p>
              <p>4. Abre a app e ativa as notificações</p>
            </div>
          )}
          {iosNeedsPermission && (
            <Button size="sm" className="mt-2" onClick={subscribe}>Ativar notificações</Button>
          )}
        </CardContent>
      </Card>

      {/* ── Estado do utilizador ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5" />
            Estado atual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {statusLoading ? (
            <div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> A verificar…</div>
          ) : (
            <>
              <StatusDot
                ok={!userStatus?.error}
                label={userStatus?.error ? `Erro: ${userStatus.error}` : (userStatus?.status || 'Sem registos hoje')}
              />
              <StatusDot
                ok={permission === 'granted'}
                label={permission === 'granted' ? 'Permissão de notificações concedida' : `Permissão: ${permission}`}
              />
              <StatusDot
                ok={!!userStatus?.hasPushSubscription}
                label={userStatus?.hasPushSubscription ? 'Subscrição push registada na BD' : 'Sem subscrição push na BD'}
              />
              {permission === 'denied' && (
                <p className="text-xs text-destructive mt-1">
                  Notificações bloqueadas no browser. Vai às definições do browser para desbloquear.
                </p>
              )}
              {permission !== 'granted' && permission !== 'denied' && !iosNeedsPWA && (
                <Button size="sm" className="mt-2" onClick={subscribe}>Ativar notificações</Button>
              )}
              {permission === 'granted' && !userStatus?.hasPushSubscription && (
                <Button size="sm" variant="outline" className="mt-2" onClick={async () => {
                  try {
                    // Passo 1: buscar chave VAPID
                    const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-public-key');
                    if (vapidError || !vapidData?.publicKey) throw new Error('Falha ao buscar chave VAPID: ' + (vapidError?.message || 'sem chave'));

                    // Passo 2: subscrever push no browser
                    const sw = await navigator.serviceWorker.ready;
                    const padding = '='.repeat((4 - vapidData.publicKey.length % 4) % 4);
                    const base64 = (vapidData.publicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
                    const key = new Uint8Array([...atob(base64)].map(c => c.charCodeAt(0)));
                    const existing = await sw.pushManager.getSubscription();
                    if (existing) await existing.unsubscribe();
                    const sub = await sw.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });

                    // Passo 3: guardar na BD via edge function (bypassa RLS)
                    const j = sub.toJSON();
                    const { error: dbError } = await supabase.functions.invoke('register-push-subscription', {
                      body: { user_id: user?.id, endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_agent: navigator.userAgent },
                    });
                    if (dbError) throw new Error('Erro ao guardar na BD: ' + dbError.message);

                    toast({ title: 'Subscrição registada com sucesso' });
                    setTimeout(fetchUserStatus, 1000);
                  } catch (e) {
                    toast({ title: 'Erro', description: e.message, variant: 'destructive' });
                  }
                }}>
                  Registar subscrição neste dispositivo
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Testes de notificação ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="h-5 w-5" />
            Testes de notificação
          </CardTitle>
          <CardDescription className="text-xs">
            Todos os testes enviam push reais via Supabase Edge Functions para este dispositivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <TestRow
            id="push-direto"
            label="Push direto"
            description="Envia notificação push imediata para este utilizador."
            fn={() => NotificationTestService.sendCustomTestNotification({
              userId: user?.id,
              title: 'Teste de Notificação',
              message: 'Push recebido com sucesso neste dispositivo!',
            })}
          />
          <TestRow
            id="shift-alert"
            label="Verificar alertas de turno agora"
            description="Dispara a função shift-alert-cron (só envia se coincidir com um horário de alerta)."
            fn={() => NotificationTestService.triggerScheduledCheck('shift-alert-cron')}
          />
          <TestRow
            id="auto-close"
            label="Verificar fecho automático agora"
            description="Dispara a função auto-close-cron (só fecha se forem 23:30 Lisboa)."
            fn={() => NotificationTestService.triggerScheduledCheck('auto-close-cron')}
          />
          <TestRow
            id="vapid-key"
            label="Buscar chave VAPID"
            description="Verifica se a edge function get-vapid-public-key está acessível."
            fn={async () => {
              const { data, error } = await supabase.functions.invoke('get-vapid-public-key');
              if (error || !data?.publicKey) return { success: false, error: error?.message || 'Sem chave' };
              return { success: true, data: { key: data.publicKey.slice(0, 20) + '…' } };
            }}
          />
          <TestRow
            id="notif-local"
            label="Notificação local"
            description="Mostra uma notificação local via Service Worker (não passa pelo servidor)."
            fn={async () => {
              try {
                await NotificationService.sendNotification('Notificação Local', {
                  body: 'Esta notificação foi gerada localmente no dispositivo.',
                });
                return { success: true, data: { origem: 'local' } };
              } catch (e) {
                return { success: false, error: e.message };
              }
            }}
          />
        </CardContent>
      </Card>

      {/* ── Resumo dos alertas ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5" />
            Resumo dos alertas automáticos
          </CardTitle>
          <CardDescription className="text-xs">
            Todos os horários são hora de Lisboa. O pg_cron corre a cada minuto e a função verifica se é o momento certo.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {ALERT_SCHEDULE.map((a, i) => (
            <div key={i} className={`flex gap-4 p-4 border-b last:border-b-0 ${a.isAutoClose ? 'bg-amber-50 dark:bg-amber-950/20' : ''}`}>
              <div className="shrink-0 w-14 text-center">
                <span className="text-sm font-mono font-bold text-primary">{a.time}</span>
              </div>
              <div className="flex-1 min-w-0 space-y-0.5">
                <p className="text-sm font-semibold">{a.label}</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Condição:</span> {a.condition}
                </p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Mensagem:</span> "{a.message}"
                </p>
              </div>
              {a.isAutoClose && (
                <Badge variant="outline" className="shrink-0 self-start text-xs border-amber-400 text-amber-700 dark:text-amber-400">
                  auto-close
                </Badge>
              )}
            </div>
          ))}
          <div className="px-4 py-3 bg-muted/40 text-xs text-muted-foreground flex items-start gap-2">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              O fecho automático (23:30) cria registos separados por turno e envia uma notificação ao utilizador.
              O pg_cron cobre verão (22:30 UTC) e inverno (23:30 UTC) automaticamente.
            </span>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default NotificationTestPanel;
