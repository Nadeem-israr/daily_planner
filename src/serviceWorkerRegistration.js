// serviceWorkerRegistration.js

// Service Worker Version (update this when making changes to worker logic)
const SW_VERSION = '1.0.1';

// Custom Event Channel for SW communication
const serviceWorkerChannel = new BroadcastChannel('sw-messages');

// Check if running on localhost
const isLocalhost = Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '[::1]' ||
  window.location.hostname.match(/^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/)
);

export function register(config) {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL, window.location.href);
    
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', async () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;

      if (isLocalhost) {
        await checkValidServiceWorker(swUrl, config);
        setupLocalhostLogging();
      } else {
        await registerValidSW(swUrl, config);
      }

      // Setup periodic sync (every 6 hours)
      if ('periodicSync' in navigator) {
        try {
          await navigator.periodicSync.register('planner-updates', {
            minInterval: 6 * 60 * 60 * 1000 // 6 hours
          });
          console.log('Periodic background sync registered');
        } catch (error) {
          console.log('Periodic background sync failed:', error);
        }
      }

      // Setup notifications
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted');
          }
        });
      }
    });
  }
}

async function registerValidSW(swUrl, config) {
  try {
    const registration = await navigator.serviceWorker.register(swUrl);
    
    registration.onupdatefound = () => {
      const installingWorker = registration.installing;
      if (!installingWorker) return;

      installingWorker.onstatechange = () => {
        if (installingWorker.state === 'installed') {
          handleWorkerInstallation(registration, config);
        }
      };
    };

    // Add service worker message listener
    navigator.serviceWorker.addEventListener('message', event => {
      if (config?.onPushMessage) {
        config.onPushMessage(event.data);
      }
    });

    console.log(`ServiceWorker v${SW_VERSION} registered`);
  } catch (error) {
    console.error('ServiceWorker registration failed:', error);
  }
}

function handleWorkerInstallation(registration, config) {
  if (navigator.serviceWorker.controller) {
    console.log('New content available; please refresh');

    if (config?.onUpdate) {
      config.onUpdate(registration);
    }

    // Send version update message
    serviceWorkerChannel.postMessage({
      type: 'VERSION_UPDATE',
      version: SW_VERSION
    });
  } else {
    console.log('Content is cached for offline use');
    
    if (config?.onSuccess) {
      config.onSuccess(registration);
    }
  }
}

async function checkValidServiceWorker(swUrl, config) {
  try {
    const response = await fetch(swUrl, { headers: { 'Service-Worker': 'script' } });
    const contentType = response.headers.get('content-type');
    
    if (response.status === 404 || !contentType.includes('javascript')) {
      await unregister();
      window.location.reload();
    } else {
      await registerValidSW(swUrl, config);
    }
  } catch {
    console.log('No internet connection. Running in offline mode');
  }
}

function setupLocalhostLogging() {
  navigator.serviceWorker.ready.then(() => {
    console.log(
      'This PWA is being served cache-first by a service worker.\n' +
      'Learn more at https://cra.link/PWA'
    );
  });
}

export async function unregister() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.unregister();
      console.log('ServiceWorker unregistered');
    } catch (error) {
      console.error('ServiceWorker unregistration failed:', error);
    }
  }
}

// Notification Handler API
export const NotificationHandler = {
  showNotification: (title, options) => {
    if ('serviceWorker' in navigator && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options);
      });
    }
  },
  
  requestPermission: async () => {
    return Notification.requestPermission();
  },
  
  scheduleReminder: (time, message) => {
    serviceWorkerChannel.postMessage({
      type: 'SCHEDULE_REMINDER',
      time,
      message
    });
  }
};