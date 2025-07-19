
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let appId: string;
let initialAuthToken: string | null;


function initializeFirebase() {
    if (typeof window !== 'undefined' && !getApps().length) {
        const firebaseConfigStr = (window as any).__firebase_config;
        if (firebaseConfigStr) {
            const firebaseConfig = JSON.parse(firebaseConfigStr);
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
            appId = (window as any).__app_id || 'default-app-id';
            initialAuthToken = (window as any).__initial_auth_token || null;
        } else {
            // Config not available yet, do nothing.
            // It might be available on a subsequent call.
        }
    } else if (getApps().length) {
        app = getApp();
        auth = getAuth(app);
        db = getFirestore(app);
        appId = (window as any).__app_id || 'default-app-id';
        initialAuthToken = (window as any).__initial_auth_token || null;
    }
}

// Call it once to try initializing
initializeFirebase();

// Export getters that will ensure initialization
function getFirebaseAuth() {
    if (!auth) initializeFirebase();
    if (!auth) console.error("Firebase Auth could not be initialized.");
    return auth;
}

function getFirebaseDb() {
    if (!db) initializeFirebase();
    if (!db) console.error("Firestore could not be initialized.");
    return db;
}

function getFirebaseAppId() {
    if (!appId) initializeFirebase();
    return appId;
}

function getInitialAuthToken() {
    if (initialAuthToken === undefined) initializeFirebase();
    return initialAuthToken;
}


export { 
    getFirebaseAuth, 
    getFirebaseDb,
    getFirebaseAppId,
    getInitialAuthToken
};
