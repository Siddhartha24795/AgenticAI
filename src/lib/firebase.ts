
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let appId: string | null = null;
let initialAuthToken: string | null = null;

function initializeFirebase() {
    if (typeof window === 'undefined' || app) {
        return;
    }

    if (getApps().length) {
        app = getApp();
    } else {
        const firebaseConfigStr = (window as any).__firebase_config;
        if (firebaseConfigStr) {
            try {
                const firebaseConfig = JSON.parse(firebaseConfigStr);
                app = initializeApp(firebaseConfig);
            } catch (e) {
                console.error("Failed to parse Firebase config:", e);
                return; 
            }
        } else {
            // Config not available yet.
            return;
        }
    }

    if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
        appId = (window as any).__app_id || 'default-app-id';
        initialAuthToken = (window as any).__initial_auth_token || null;
    }
}

function getFirebaseAuth(): Auth | null {
    if (!auth) {
        initializeFirebase();
    }
    return auth;
}

function getFirebaseDb(): Firestore | null {
    if (!db) {
        initializeFirebase();
    }
    return db;
}

function getFirebaseAppId(): string | null {
    if (!appId) {
        initializeFirebase();
    }
    return appId;
}

function getInitialAuthToken(): string | null {
    if (initialAuthToken === null) {
        initializeFirebase();
    }
    return initialAuthToken;
}

export { 
    getFirebaseAuth, 
    getFirebaseDb,
    getFirebaseAppId,
    getInitialAuthToken
};
