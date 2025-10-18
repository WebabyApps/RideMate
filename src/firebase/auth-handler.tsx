'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@/firebase/provider';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

/**
 * An invisible component that handles automatic anonymous sign-in on initial load.
 */
export function AuthHandler() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const [hasAttemptedInitialSignIn, setHasAttemptedInitialSignIn] = useState(false);

  useEffect(() => {
    // Only run this logic if we haven't already tried to sign in,
    // and the user state is resolved and no user is present.
    if (!isUserLoading && !user && !hasAttemptedInitialSignIn) {
      // Mark that we are attempting the sign-in.
      setHasAttemptedInitialSignIn(true);
      // This is a non-blocking call. The `useUser` hook will update
      // once the onAuthStateChanged listener fires with the new user state.
      initiateAnonymousSignIn(auth);
    }
  }, [isUserLoading, user, auth, hasAttemptedInitialSignIn]);

  // This component renders nothing.
  return null;
}
