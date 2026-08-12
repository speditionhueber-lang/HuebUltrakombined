"use client";

import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { initializeFirebase } from "@/src/firebase/init";
import { doc, updateDoc, getFirestore } from "firebase/firestore";

/**
 * Fragt die Notification-Permission ab, registriert den Service Worker,
 * holt das FCM-Token und speichert es im Worker-Dokument.
 */
export const requestNotificationPermission = async (workerId: string) => {
  console.log("Attempting to get notification permission...");

  if (typeof window === "undefined") {
    console.warn("Notification request called on server – ignored.");
    return;
  }

  if (typeof Notification === "undefined") {
    console.warn("Notification API is not available in this environment.");
    return;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("Firebase Messaging is not supported in this browser.");
      return;
    }

    const { firebaseApp } = initializeFirebase();
    const firestore = getFirestore(firebaseApp);

    if (!firebaseApp || !firestore) {
      console.error("Firebase not initialized correctly.");
      return;
    }

    const messaging = getMessaging(firebaseApp);
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("Notification permission granted.");

      const VAPID_KEY = (import.meta as any).env.VITE_FCM_VAPID_KEY;
      if (!VAPID_KEY) {
        console.error("VAPID key not found in environment variables (VITE_FCM_VAPID_KEY).");
        return;
      }

      console.log("Attempting to retrieve FCM token...");
      const swRegistration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (currentToken) {
        console.log("FCM Token successfully retrieved:", currentToken);
        const workerRef = doc(firestore, "workers", workerId);
        await updateDoc(workerRef, { fcmToken: currentToken });
        console.log("FCM token saved to Firestore for worker:", workerId);
      } else {
        console.warn("Could not retrieve FCM token.");
      }
    } else {
      console.warn("Notification permission was not granted. Status:", permission);
    }
  } catch (err) {
    console.error("An error occurred during notification permission request.", err);
  }
};

/**
 * Richtet einen Foreground-Handler ein, der Nachrichten verarbeitet,
 * solange die App geöffnet ist.
 */
export const setupForegroundMessageHandler = async () => {
  try {
    if (typeof window === "undefined") return;

    const hasNotification = typeof Notification !== "undefined";
    const supported = await isSupported();
    if (!supported) return;

    const { firebaseApp } = initializeFirebase();
    if (!firebaseApp) return;

    const messaging = getMessaging(firebaseApp);

    onMessage(messaging, (payload) => {
      console.log("Foreground message received in `onMessage`.", payload);

      if (!hasNotification) {
        return;
      }

      if (payload.notification && Notification.permission === "granted") {
        new Notification(payload.notification.title!, {
          body: payload.notification.body,
          icon: payload.notification.icon,
        });
      }
    });
  } catch (error) {
    console.error("Error setting up foreground message handler:", error);
  }
};
