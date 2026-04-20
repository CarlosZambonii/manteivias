export const isAndroid = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  return userAgent.indexOf("android") > -1;
};

export const hasNotificationPermission = () => {
  if (!('Notification' in window)) return false;
  return Notification.permission === 'granted';
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;

  const hasAsked = localStorage.getItem('manteivias_notif_asked');
  if (hasAsked === 'true' && Notification.permission !== 'default') {
    return Notification.permission === 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('manteivias_notif_asked', 'true');
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};