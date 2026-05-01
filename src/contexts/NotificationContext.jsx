import React, { createContext, useContext, useState, useEffect } from 'react';
import { NotificationService } from '@/services/NotificationService.js';
import { useAuth } from '@/contexts/AuthContext.jsx';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [permission, setPermission] = useState('default');
  const [isSupported, setIsSupported] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const supported = NotificationService.isNotificationSupported();
    setIsSupported(supported);
    
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Ensure push subscriptions are registered if we are authenticated and have permissions
  useEffect(() => {
    // Check for user existence from AuthContext instead of session
    if (user && permission === 'granted' && isSupported) {
      NotificationService.registerPushSubscription(user.id);
    }
  }, [user, permission, isSupported]);

  const requestPermission = async () => {
    if (!isSupported) return 'denied';
    const newPermission = await NotificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const sendNotification = async (title, options) => {
    await NotificationService.sendNotification(title, options);
  };

  const scheduleNotification = (title, options, delayMs) => {
    return NotificationService.scheduleNotification(title, options, delayMs);
  };

  const subscribeToNotifications = (callback) => {
    return NotificationService.subscribeToNotifications(callback);
  };

  const value = {
    permission,
    isSupported,
    requestPermission,
    subscribe: requestPermission,          // alias used by NotificationTestPanel
    isSubscribed: permission === 'granted', // alias used by NotificationTestPanel
    sendNotification,
    scheduleNotification,
    subscribeToNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};