
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, type User } from 'firebase/auth';
import { getFirebaseAuth, getInitialAuthToken } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // getFirebaseAuth will initialize if needed
    const auth = getFirebaseAuth(); 
    if (!auth) {
        // This can happen if the firebase config is not yet available.
        // The effect will re-run once the component re-renders.
        return;
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
