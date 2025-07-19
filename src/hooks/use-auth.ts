
'use client';

import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, type User, type AuthError } from 'firebase/auth';
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
        if (!isAuthReady) setIsAuthReady(true);
      } else {
        try {
          await signInAnonymously(auth);
          // The onAuthStateChanged will be called again with the new user,
          // so we don't need to set the user here.
        } catch (e) {
          const error = e as AuthError;
          console.error("Firebase anonymous sign-in error:", error);
          if (error.code === 'auth/admin-restricted-operation') {
             toast({
                title: "Authentication Failed: Admin Restricted",
                description: "The API key being used is not authorized for this sign-in method. Please ensure you are using a Web API Key from your Firebase project's settings.",
                variant: "destructive",
                duration: 10000,
             });
          } else {
            toast({
              title: "Authentication Failed",
              description: `Could not sign in anonymously. Error: ${error.message}`,
              variant: "destructive",
            });
          }
          setIsAuthReady(true); // Unblock UI if sign-in fails
        }
      }
    });

    return () => unsubscribe();
  }, [toast, isAuthReady]);

  return { user, isAuthReady };
}
