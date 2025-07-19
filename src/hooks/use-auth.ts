
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, type User, type Auth } from 'firebase/auth';
import { getFirebaseAuth, getInitialAuthToken } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Function to handle the authentication logic
    const initAuth = () => {
      const auth = getFirebaseAuth();
      if (!auth) {
        // If auth isn't ready, we shouldn't proceed.
        // The check for config readiness below should prevent this.
        console.error("Firebase Auth could not be initialized. This should not happen.");
        setIsAuthReady(true); // Unblock UI
        return;
      }

      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
        } else {
          try {
            const initialAuthToken = getInitialAuthToken();
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
          } catch (error) {
            console.error("Firebase authentication error:", error);
            toast({
              title: "Authentication Failed",
              description: (error as Error).message,
              variant: "destructive",
            });
          }
        }
        setIsAuthReady(true);
      });

      return unsubscribe;
    };

    // Check if the Firebase config is ready on the window object.
    // If not, wait for it. This is crucial to avoid race conditions.
    if (typeof window !== 'undefined' && !(window as any).__firebase_config) {
      const interval = setInterval(() => {
        if ((window as any).__firebase_config) {
          clearInterval(interval);
          initAuth();
        }
      }, 100); // Check every 100ms

      // Timeout to prevent an infinite loop
      const timeout = setTimeout(() => {
        clearInterval(interval);
        if (!(window as any).__firebase_config) {
           setIsAuthReady(true); // Unblock UI
           console.error("Firebase config not available after delay.");
           toast({
             title: "Configuration Error",
             description: "Could not initialize Firebase. Please check your configuration.",
             variant: "destructive",
           });
        }
      }, 5000); // 5-second timeout

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    } else {
      // Config is ready, initialize auth immediately.
      const unsubscribe = initAuth();
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }
  }, [toast]);

  return { user, isAuthReady };
}
