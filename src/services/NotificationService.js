import { supabase } from '@/lib/customSupabaseClient.js';
import { translations } from '@/i18n/translations';

const getLang = () => {
  const lang = localStorage.getItem('manteivias_language') || 'pt';
  return translations[lang] ? lang : 'pt';
};

const tNotif = (lang, type, statusKey, field) => {
  return translations[lang]?.notifications?.[type]?.[field]
    || translations.pt.notifications[type][field];
};

export const sendSubmissionNotification = async (userId, type) => {
  if (!userId) return;
  const lang = getLang();
  const title = translations[lang]?.notifications?.[type]?.submittedTitle
    || translations.pt.notifications[type]?.submittedTitle;
  const message = translations[lang]?.notifications?.[type]?.submittedMsg
    || translations.pt.notifications[type]?.submittedMsg;
  if (!title || !message) return;
  try {
    await supabase.functions.invoke('send-push-notification', {
      body: { userId, title, message, data: { url: '/historico' } },
    });
  } catch (err) {
    console.error('[sendSubmissionNotification] Failed:', err);
  }
};

export const sendApprovalNotification = async (userId, type, status, comment = '') => {
  if (!userId) return;
  const lang = getLang();
  const statusKey = status === 'Aprovado' ? 'approved' : 'rejected';

  const title = tNotif(lang, type, statusKey, `${statusKey}Title`);
  const baseMsg = tNotif(lang, type, statusKey, `${statusKey}Msg`);
  const reasonPrefix = translations[lang]?.notifications?.reasonPrefix || translations.pt.notifications.reasonPrefix;

  if (!title || !baseMsg) return;

  const message = (status === 'Rejeitado' && comment)
    ? `${baseMsg} ${reasonPrefix} ${comment}`
    : baseMsg;

  try {
    await supabase.functions.invoke('send-push-notification', {
      body: { userId, title, message, data: { url: '/historico' } },
    });
  } catch (err) {
    console.error('[sendApprovalNotification] Failed:', err);
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export const registerPushSubscription = async (dbUserId = null) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;

  try {
    let userId = dbUserId;

    if (!userId) {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return null;

      const { data: dbUser } = await supabase
        .from('usuarios')
        .select('id')
        .eq('auth_uuid', authUser.id)
        .single();

      if (!dbUser?.id) {
        console.error('[Push] Could not resolve database user ID for push subscription.');
        return null;
      }
      userId = dbUser.id;
    }

    const registration = await navigator.serviceWorker.ready;

    const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-public-key');
    if (vapidError || !vapidData?.publicKey) {
      console.warn('Could not fetch VAPID public key. Ensure get-vapid-public-key edge function is deployed and has keys set.');
      return null;
    }

    const convertedVapidKey = urlBase64ToUint8Array(vapidData.publicKey);

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    const subJson = subscription.toJSON();

    // Persist subscription in Supabase
    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: subJson.endpoint,
      p256dh: subJson.keys.p256dh,
      auth: subJson.keys.auth,
      user_agent: navigator.userAgent
    }, { onConflict: 'endpoint' });

    if (error) throw error;
    
    console.log('Push subscription successfully registered and saved.');
    return subscription;
  } catch (err) {
    console.error('Error registering push subscription:', err);
    return null;
  }
};

export const sendNotification = async (title, options = {}) => {
  if (!NotificationService.isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, {
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          vibrate: [100, 50, 100],
          ...options
        });
        return;
      }
    }
    
    // Fallback for environments without service worker showNotification support
    new Notification(title, {
      icon: '/icon-192x192.png',
      ...options
    });
  } catch (error) {
    console.error('Failed to send notification:', error);
    try {
      new Notification(title, options);
    } catch (fallbackError) {
      console.error('Fallback notification also failed:', fallbackError);
    }
  }
};

export const subscribeToNotifications = (callback) => {
  if (!('serviceWorker' in navigator)) return () => {};

  const messageHandler = (event) => {
    if (event.data && event.data.type === 'PUSH_NOTIFICATION_RECEIVED') {
      if (callback) callback(event.data.payload);
    }
  };

  navigator.serviceWorker.addEventListener('message', messageHandler);
  
  return () => {
    navigator.serviceWorker.removeEventListener('message', messageHandler);
  };
};

export const NotificationService = {
  isNotificationSupported: () => {
    return 'Notification' in window;
  },

  requestPermission: async () => {
    if (!NotificationService.isNotificationSupported()) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await registerPushSubscription();
      }
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  },

  sendNotification,
  registerPushSubscription,

  scheduleNotification: (title, options = {}, delayMs) => {
    if (delayMs <= 0) {
      sendNotification(title, options);
      return null;
    }
    
    const timeoutId = setTimeout(() => {
      sendNotification(title, options);
    }, delayMs);
    
    return timeoutId;
  },

  subscribeToNotifications
};