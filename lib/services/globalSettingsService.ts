import { db } from '@/lib/firebase/client';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

export interface GlobalSettings {
  darkMode: boolean;
  // Add more global settings fields here
}

const SETTINGS_DOC = 'global_settings/main';

// Real-time subscription to global settings
type Callback = (settings: GlobalSettings) => void;
export function getGlobalSettings(callback: Callback) {
  const ref = doc(db, SETTINGS_DOC);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as GlobalSettings);
    } else {
      callback({ darkMode: false });
    }
  });
}

// Update global settings (merges fields)
export async function updateGlobalSettings(settings: GlobalSettings) {
  const ref = doc(db, SETTINGS_DOC);
  await setDoc(ref, settings, { merge: true });
}
