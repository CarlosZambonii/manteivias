import { useNotifications as useContextNotifications } from '@/contexts/NotificationContext';

export const useNotifications = () => {
  return useContextNotifications();
};