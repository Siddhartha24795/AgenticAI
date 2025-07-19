'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken, type User } from 'firebase/auth';
import { auth, initialAuthToken } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
        console.warn("Firebase Auth is not initialized.");
        setIsAuthReady(true);
        return;
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsAuthReady(true);
      } else {
        try {
          // The onAuthStateChanged listener will be called again with the new user
          // after a successful sign-in, which will then set the user and isAuthReady state.
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
          setIsAuthReady(true); // Mark as ready even on error to avoid UI blocking
        }
      }
    });

    return () => unsubscribe();
  }, [toast]);

  return { user, isAuthReady };
}
