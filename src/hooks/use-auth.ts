
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
    const auth = getFirebaseAuth();
    if (!auth) {
        // Try again in a bit, firebase might not be ready
        const timeoutId = setTimeout(() => setIsAuthReady(false), 100);
        return () => clearTimeout(timeoutId);
    };
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsAuthReady(true);
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
          setIsAuthReady(true); // Mark as ready even on error
        }
      }
    });

    return () => unsubscribe();
  }, [toast, isAuthReady]); // Re-run if auth wasn't ready

  return { user, isAuthReady };
}
