import API_BASE from './api';
import ringtoneService from './ringtone';

// Helper to convert base64 VAPID public key to Uint8Array
export const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

// Retrieve VAPID public key from env or backend API
let cachedVapidKey = null;
export const getVapidPublicKey = async () => {
  if (cachedVapidKey) return cachedVapidKey;

  const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (envKey && envKey.trim().length > 20) {
    cachedVapidKey = envKey.trim();
    return cachedVapidKey;
  }

  try {
    const res = await fetch(`${API_BASE}/api/push/vapid-public-key`);
    if (res.ok) {
      const data = await res.json();
      if (data?.publicKey) {
        cachedVapidKey = data.publicKey;
        return cachedVapidKey;
      }
    }
  } catch (err) {
    console.error('Failed to fetch VAPID key from backend:', err);
  }

  // Fallback to default known key
  cachedVapidKey = 'BMlhL-j5mjXka7n5XD9rXg7qXLPVB1xXvoFS2oCblFkbROvg77ugGmZoJC50KIElNv0oP-2YyyVRFXWrA3AeFeI';
  return cachedVapidKey;
};

// Check if push notifications are supported on this device/browser
export const isPushSupported = () => {
  return typeof window !== 'undefined' && 
    'serviceWorker' in navigator && 
    'PushManager' in window && 
    'Notification' in window;
};

// Silently subscribe or sync existing subscription with backend
export const subscribeUserToPush = async (userId) => {
  if (!userId || !isPushSupported()) return false;
  if (Notification.permission !== 'granted') return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const publicKey = await getVapidPublicKey();
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
    }

    if (subscription) {
      await fetch(`${API_BASE}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: userId, subscription })
      });
      localStorage.setItem('campusbridge_push_synced_' + userId, 'true');
      return true;
    }
  } catch (err) {
    console.error('Error in subscribeUserToPush:', err);
  }
  return false;
};

// Explicitly prompt user for notification permission and subscribe
export const requestAndSubscribePush = async (userId) => {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported on this browser.');
  }

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const success = await subscribeUserToPush(userId);
    return success;
  } else if (permission === 'denied') {
    throw new Error('Notification permission was blocked in browser settings.');
  } else {
    return false;
  }
};

// Send a test push notification
export const sendTestPush = async (userId) => {
  if (!userId) return false;
  try {
    const res = await fetch(`${API_BASE}/api/push/test-push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerkId: userId })
    });
    return await res.json();
  } catch (err) {
    console.error('sendTestPush error:', err);
    return { error: err.message };
  }
};

// Send a direct browser notification with optional sound
export const sendBrowserNotification = async (title, options = {}) => {
  const {
    body = 'You have a new update.',
    icon = '/icon-192x192.png',
    url = '/dashboard',
    tag,
    playSound = true,
    onClick
  } = options;

  // 1. Play sound if requested and enabled
  if (playSound) {
    try {
      const soundEnabled = localStorage.getItem('campusbridge_notification_sound') !== 'false';
      if (soundEnabled) {
        ringtoneService.playNotificationSound();
      }
    } catch (e) {
      console.warn('Could not play notification sound:', e);
    }
  }

  // 2. Request permission if currently 'default'
  if (typeof window !== 'undefined' && 'Notification' in window) {
    let perm = Notification.permission;
    if (perm === 'default') {
      try {
        perm = await Notification.requestPermission();
      } catch (e) {}
    }

    if (perm === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon,
          badge: '/icon-192x192.png',
          tag: tag || ('cb-notif-' + Date.now()),
          data: { url }
        });

        notif.onclick = () => {
          window.focus();
          if (onClick) {
            onClick();
          } else if (url && window.location.pathname !== url) {
            window.location.href = url;
          }
          notif.close();
        };

        return notif;
      } catch (err) {
        // Fallback for environments where new Notification() fails (some mobile browsers)
        if ('serviceWorker' in navigator) {
          try {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification(title, {
              body,
              icon,
              badge: '/icon-192x192.png',
              tag: tag || ('cb-notif-' + Date.now()),
              data: { url }
            });
          } catch (swErr) {
            console.warn('ServiceWorker showNotification fallback error:', swErr);
          }
        }
      }
    }
  }
  return null;
};
