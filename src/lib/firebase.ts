
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, RecaptchaVerifier, type RecaptchaParameters } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function initializeFirebase() {
    if (typeof window !== 'undefined') {
        if (!getApps().length) {
            if (
                firebaseConfig.apiKey &&
                firebaseConfig.authDomain &&
                firebaseConfig.projectId &&
                firebaseConfig.appId
            ) {
                try {
                    app = initializeApp(firebaseConfig);
                    auth = getAuth(app);
                    db = getFirestore(app);
                } catch (e) {
                    console.error("Error initializing Firebase", e);
                }
            } else {
                console.error("Firebase configuration is missing or incomplete. Please check your .env file.");
            }
        } else {
            app = getApp();
            auth = getAuth(app);
            db = getFirestore(app);
        }
    }
}

// Initialize Firebase immediately on client-side load
initializeFirebase();

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
    return process.env.NEXT_PUBLIC_FIREBASE_APP_ID || null;
}

function setupRecaptcha(containerId: string, params?: RecaptchaParameters): RecaptchaVerifier | null {
    const auth = getFirebaseAuth();
    if (!auth || typeof window === 'undefined') return null;

    // To prevent re-rendering issues, we store the verifier on the window object.
    if ((window as any).recaptchaVerifierInstance) {
        // Here you might want to render it again if it was cleared
        // but for invisible recaptcha, this might not be needed.
        return (window as any).recaptchaVerifierInstance;
    }
    
    const verifier = new RecaptchaVerifier(auth, containerId, params);

    (window as any).recaptchaVerifierInstance = verifier;

    return verifier;
}


export { 
    getFirebaseAuth, 
    getFirebaseDb,
    getFirebaseAppId,
    setupRecaptcha
};
