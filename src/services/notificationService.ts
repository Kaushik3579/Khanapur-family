import type { User } from 'firebase/auth';
import { arrayUnion, doc, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { db } from './firebase';

type ForegroundHandler = (title: string, body: string) => void;

let unsubscribeForeground: (() => void) | null = null;

const playTone = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    // no-op: audio can fail in restricted browser contexts
  }
};

export const enableConnectNotifications = async (
  user: User,
  onForegroundMessage?: ForegroundHandler,
) => {
  if (!(await isSupported()) || typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission === 'denied') return;

  const permission =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission();

  if (permission !== 'granted') return;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) return;

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
  const messaging = getMessaging();
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });

  if (token) {
    await setDoc(
      doc(db, 'connectProfiles', user.uid),
      {
        userId: user.uid,
        email: user.email || '',
        fcmTokens: arrayUnion(token),
      },
      { merge: true },
    );
  }

  if (unsubscribeForeground) unsubscribeForeground();
  unsubscribeForeground = onMessage(messaging, (payload) => {
    const title = payload.notification?.title || 'New Connect message';
    const body = payload.notification?.body || '';
    playTone();
    if (onForegroundMessage) onForegroundMessage(title, body);
  });
};
