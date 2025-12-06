// Firebase Cloud Messaging Helper
// Handles FCM token generation and notification permissions

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig, vapidKey } from './firebase-config';

let app = null;
let messaging = null;

// Initialize Firebase (only once)
export const initializeFirebase = () => {
  try {
    if (!app) {
      app = initializeApp(firebaseConfig);
      messaging = getMessaging(app);
      console.log('[FCM] Firebase initialized successfully');
    }
    return { app, messaging };
  } catch (error) {
    console.error('[FCM] Firebase initialization failed:', error);
    return { app: null, messaging: null };
  }
};

// Request notification permission and get FCM token
export const requestFCMToken = async () => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('[FCM] This browser does not support notifications');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Notification permission denied');
      return null;
    }

    // Initialize Firebase if not already done
    const { messaging } = initializeFirebase();
    if (!messaging) {
      console.error('[FCM] Messaging not initialized');
      return null;
    }

    // Register service worker first
    let registration = null;
    if ('serviceWorker' in navigator) {
      try {
        registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        await navigator.serviceWorker.ready;
        console.log('[FCM] Service worker registered');
      } catch (swError) {
        console.error('[FCM] Service worker registration failed:', swError);
      }
    }

    // Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      console.log('[FCM] ✅ Token obtained:', currentToken.substring(0, 20) + '...');
      return currentToken;
    } else {
      console.log('[FCM] No FCM token available');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback) => {
  try {
    const { messaging } = initializeFirebase();
    if (!messaging) return;

    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload);
      
      // Show notification manually for foreground messages
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: payload.notification.icon || '/favicon.ico',
          badge: '/favicon.ico'
        });
      }
      
      if (callback) callback(payload);
    });
  } catch (error) {
    console.error('[FCM] Error setting up foreground listener:', error);
  }
};