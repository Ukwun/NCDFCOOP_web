import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface GlobalSettings {
  darkMode: boolean;
  themeColor: string;
  inAppNotifications: boolean;
  language: string;
}

const SETTINGS_DOC = 'global_settings/main';

// Real-time subscription to global settings
type Callback = (settings: GlobalSettings) => void;
export function getGlobalSettings(callback: Callback) {
  const ref = doc(db, SETTINGS_DOC);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as GlobalSettings;
      callback({
        darkMode: data.darkMode ?? false,
        themeColor: data.themeColor ?? '#2563eb',
        inAppNotifications: data.inAppNotifications ?? true,
        language: data.language ?? 'en',
      });
    } else {
      callback({
        darkMode: false,
        themeColor: '#2563eb',
        inAppNotifications: true,
        language: 'en',
      });
    }
  });
}

// Update global settings (merges fields)
export async function updateGlobalSettings(settings: GlobalSettings) {
  const ref = doc(db, SETTINGS_DOC);
  await setDoc(ref, settings, { merge: true });
}
