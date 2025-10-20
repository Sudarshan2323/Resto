import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

export type FirebaseServices = {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  isConfigured: boolean;
};

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined;
const messagingSenderId = import.meta.env
  .VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined;
const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

const isConfigured = Boolean(
  apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId,
);

let services: FirebaseServices = {
  app: null,
  firestore: null,
  auth: null,
  isConfigured,
};

if (isConfigured) {
  const app = initializeApp({
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  });
  services = {
    app,
    firestore: getFirestore(app),
    auth: getAuth(app),
    isConfigured,
  };
} else {
  if (import.meta.env.DEV) {
    // Keep the app running locally without Firebase configuration.
    // The data layer will fall back to local storage stores.
    // eslint-disable-next-line no-console
    console.warn(
      '[Firebase] Config not found. Falling back to local data stores. Set VITE_FIREBASE_* variables to enable Firebase.',
    );
  }
}

export const firebaseApp = services.app;
export const firestoreDb = services.firestore;
export const firebaseAuth = services.auth;
export const firebaseConfigured = services.isConfigured;
