'use client';

import { useEffect } from 'react';
import { useAuth, useUser } from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

/**
 * An invisible component that handles automatic anonymous sign-in.
 */
export function AuthHandler() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    // If auth state is resolved, not loading, and there is no user...
    if (!isUserLoading && !user) {
      // ...initiate an anonymous sign-in.
      // This is a non-blocking call. The `useUser` hook will update
      // once the onAuthStateChanged listener fires with the new user state.
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth]);

  // This component renders nothing.
  return null;
}
