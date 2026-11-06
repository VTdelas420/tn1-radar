import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from 'firebase/auth';
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from 'firebase/firestore';
import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';

// Keys come from .env.local (see .env.example). Without them the app runs
// in local-only mode, exactly as before.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseEnabled = Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let auth: Auth | null = null;

if (isFirebaseEnabled) {
  app = initializeApp(config);
  // Firestore rejects `undefined` fields by default; our types use optional fields a lot.
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  storage = getStorage(app);
  // Default is 10 minutes of retries; fail sooner so the artist sees the error.
  storage.maxUploadRetryTime = 60_000;
  storage.maxOperationRetryTime = 60_000;
  auth = getAuth(app);

  // Local testing: `npm run dev:emu` points everything at the Firebase emulators,
  // so nothing touches the real project and no paid plan is needed.
  if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  }
}

export const isUsingEmulators = isFirebaseEnabled && import.meta.env.VITE_USE_EMULATORS === 'true';

let authPromise: Promise<string | null> | null = null;

/** Signs the visitor in anonymously so security rules can require an authenticated user. */
export function ensureSignedIn(): Promise<string | null> {
  if (!auth) return Promise.resolve(null);
  if (auth.currentUser) return Promise.resolve(auth.currentUser.uid);
  if (!authPromise) {
    authPromise = signInAnonymously(auth)
      .then((cred) => cred.user.uid)
      .catch((err) => {
        console.error('Firebase anonymous sign-in failed:', err);
        authPromise = null;
        return null;
      });
  }
  return authPromise;
}

export { db, storage };
