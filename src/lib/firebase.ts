'use client';

import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = typeof window !== 'undefined' && (window as any).__firebase_config ? JSON.parse((window as any).__firebase_config) : {};

let app;
if (typeof window !== 'undefined') {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

const auth = typeof window !== 'undefined' ? getAuth(app) : null;
const db = typeof window !== 'undefined' ? getFirestore(app) : null;
const appId = typeof window !== 'undefined' && (window as any).__app_id ? (window as any).__app_id : 'default-app-id';
const initialAuthToken = typeof window !== 'undefined' && (window as any).__initial_auth_token ? (window as any).__initial_auth_token : null;


export { app, auth, db, appId, initialAuthToken };
