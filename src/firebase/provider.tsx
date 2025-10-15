'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  // User authentication state
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// Initialize services immediately at the module level.
// This ensures they are available on the first render.
const { firebaseApp, firestore, auth } = initializeFirebase();

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 * It initializes Firebase on the client and listens for auth changes.
 */
export const FirebaseProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<UserHookResult>({
    user: auth.currentUser, // Initialize with current user, if any
    isUserLoading: true,
    userError: null,
  });

  // Set up the authentication state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );

    // If there's no user after initial check, stop loading.
    // This handles the case where the user is not logged in.
    if (!auth.currentUser) {
       setUserAuthState(prev => ({ ...prev, isUserLoading: false }));
    }

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []); // Empty dependency array ensures this runs only once


  // The context value is memoized. The core services are stable.
  // userAuthState is passed in separately to avoid re-creating the entire context on auth change.
  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
      ...userAuthState,
    };
  }, [userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// --- Service Hooks ---

/** Hook to access Firebase Auth instance. Throws if not available. */
export const useAuth = (): Auth => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useAuth must be used within a FirebaseProvider.');
  if (!context.auth) throw new Error('Auth service not available.');
  return context.auth;
};

/** Hook to access Firestore instance. Throws if not available. */
export const useFirestore = (): Firestore => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirestore must be used within a FirebaseProvider.');
  if (!context.firestore) throw new Error('Firestore service not available.');
  return context.firestore;
};

/** Hook to access Firebase App instance. Throws if not available. */
export const useFirebaseApp = (): FirebaseApp => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebaseApp must be used within a FirebaseProvider.');
  if (!context.firebaseApp) throw new Error('Firebase App not available.');
  return context.firebaseApp;
};


// --- Utility Hooks ---

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return {
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};
