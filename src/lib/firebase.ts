
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let appId: string;
let initialAuthToken: string | null;

if (typeof window !== 'undefined') {
  if (!getApps().length) {
    const firebaseConfigStr = (window as any).__firebase_config;
    if (!firebaseConfigStr) {
      throw new Error("Missing Firebase config in window object");
    }
    const firebaseConfig = JSON.parse(firebaseConfigStr);
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  
  appId = (window as any).__app_id || 'default-app-id';
  initialAuthToken = (window as any).__initial_auth_token || null;
} else {
  // Provide dummy/placeholder values for server-side rendering
  // These will be replaced by the client-side initialization.
  app = null as any;
  auth = null as any;
  db = null as any;
  appId = 'default-app-id';
  initialAuthToken = null;
}

export { app, auth, db, appId, initialAuthToken };
