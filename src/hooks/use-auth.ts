
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
      console.error("Firebase Auth service is not available.");
      toast({
        title: "Authentication Error",
        description: "Firebase is not configured correctly. Check environment variables.",
        variant: "destructive",
      });
      setIsAuthReady(true); // Unblock UI
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
          // The onAuthStateChanged will be called again with the new user,
          // so we don't need to set the user here.
        } catch (error) {
          console.error("Firebase anonymous sign-in error:", error);
          toast({
            title: "Authentication Failed",
            description: "Could not sign in anonymously. Please check your API key and Firebase config.",
            variant: "destructive",
          });
          setIsAuthReady(true); // Unblock UI if sign-in fails
        }
      }
    });

    return () => unsubscribe();
  }, [toast]);

  return { user, isAuthReady };
}
