
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, type User } from 'firebase/auth';
import { initializeFirebaseClient, getFirebaseAuth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    initializeFirebaseClient();
    const auth = getFirebaseAuth();

    if (!auth) {
      console.error("Firebase Auth service is not available.");
      toast({
        title: "Authentication Error",
        description: "Firebase is not configured correctly.",
        variant: "destructive",
      });
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
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
