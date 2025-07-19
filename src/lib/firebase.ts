'use client';

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | undefined;
let auth: Auth | null = null;
let db: Firestore | null = null;
let appId = 'default-app-id';
let initialAuthToken: string | null = null;

if (typeof window !== 'undefined') {
  const firebaseConfigStr = (window as any).__firebase_config;
  if (firebaseConfigStr) {
    const firebaseConfig = JSON.parse(firebaseConfigStr);
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    appId = (window as any).__app_id || 'default-app-id';
    initialAuthToken = (window as any).__initial_auth_token || null;
  }
}

export { app, auth, db, appId, initialAuthToken };
