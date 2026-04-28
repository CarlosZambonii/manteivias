import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import './index.css';
import { AppProviders } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';
import { OfflineDataProvider } from '@/contexts/OfflineManager';
import { TimeProvider } from '@/contexts/TimeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { requestNotificationPermission } from '@/utils/NotificationPermissionManager';
import { subscribeToNotifications } from '@/services/NotificationService.js';
import { isIOS } from '@/utils/iosDetector';

// Register Service Worker and Request Notification Permissions
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
      .then(registration => {
        console.log('SW registered successfully with scope:', registration.scope);
        return navigator.serviceWorker.ready;
      })
      .then(readyRegistration => {
        console.log('SW is active and ready.');
        // iOS requires permission from a user gesture — handled by IOSNotificationPrompt component
        if (!isIOS()) {
          requestNotificationPermission().then(granted => {
            if (granted) {
              subscribeToNotifications(null);
            }
          });
        }
      })
      .catch(registrationError => {
        console.error('SW registration failed:', registrationError);
      });
      
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('Received message from SW:', event.data);
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <>
    <Router>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <LanguageProvider>
          <OfflineDataProvider>
            <AppProviders>
              <TimeProvider>
                <NotificationProvider>
                  <App />
                </NotificationProvider>
              </TimeProvider>
            </AppProviders>
          </OfflineDataProvider>
        </LanguageProvider>
        <Toaster />
      </ThemeProvider>
    </Router>
  </>
);