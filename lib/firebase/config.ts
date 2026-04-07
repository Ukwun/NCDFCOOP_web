import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate Firebase configuration
const isFirebaseConfigValid = Object.values(firebaseConfig).every(value => !!value);

if (!isFirebaseConfigValid && typeof window !== 'undefined') {
  console.warn(
    'Firebase configuration incomplete. Missing environment variables:',
    Object.entries(firebaseConfig)
      .filter(([_, value]) => !value)
      .map(([key]) => key)
  );
}

// Initialize Firebase - only if we have the required config and are on client
let app: any = null;

if (typeof window !== 'undefined' && isFirebaseConfigValid) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
}

// Initialize services (will be null on server)
export const auth = app ? getAuth(app) : null;
export const db = (app ? getFirestore(app) : null) as any;
export const storage = (app ? getStorage(app) : null) as any;

export default app;
