
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// Initialize Firebase on the client side
if (typeof window !== 'undefined' && !getApps().length) {
  // Check if all required config values are present
  if (
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  ) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  } else {
    console.error("Firebase configuration is missing or incomplete. Please check your .env file.");
  }
} else if (getApps().length) {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
}

function getFirebaseAuth(): Auth | null {
    return auth || null;
}

function getFirebaseDb(): Firestore | null {
    return db || null;
}

function getFirebaseAppId(): string | null {
    return firebaseConfig.appId || null;
}

// This is no longer used but kept for compatibility if needed elsewhere.
function getInitialAuthToken(): string | null {
    return null;
}

export { 
    getFirebaseAuth, 
    getFirebaseDb,
    getFirebaseAppId,
    getInitialAuthToken
};
