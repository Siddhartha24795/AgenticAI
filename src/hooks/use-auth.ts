
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
    const auth = getFirebaseAuth();
    if (!auth) {
        // This can happen if the firebase config is not yet available on the client.
        // The effect will re-run once the component re-renders and it is.
        // A better approach might be to wait for an event or use a context provider
        // that initializes Firebase at the top level of the app.
        const timer = setTimeout(() => {
          if (!getFirebaseAuth()) {
            setIsAuthReady(true); // Unblock UI even if firebase is failing
            console.error("Firebase config not available after delay.");
             toast({
              title: "Configuration Error",
              description: "Could not initialize Firebase. Please check your configuration.",
              variant: "destructive",
            });
          }
        }, 3000); // Wait 3 seconds and check again.
        return () => clearTimeout(timer);
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
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

    return () => unsubscribe();
  }, [toast]);

  return { user, isAuthReady };
}
