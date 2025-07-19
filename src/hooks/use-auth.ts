
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const auth = getFirebaseAuth();

    if (!auth) {
      // This can happen if Firebase config is missing.
      // The firebase.ts module will log an error.
      setIsAuthReady(true); // Unblock the UI
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        // If not logged in, sign in anonymously
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Firebase anonymous sign-in error:", error);
          toast({
            title: "Authentication Failed",
            description: "Could not sign in anonymously.",
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
