'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

// --- Context Definitions ---

// Context for stable Firebase service instances
interface FirebaseServicesContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Context for dynamic user authentication state
interface UserAuthStateContextState {
  user: User | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// --- Context Creation ---
const FirebaseServicesContext = createContext<FirebaseServicesContextState | undefined>(undefined);
const UserAuthStateContext = createContext<UserAuthStateContextState | undefined>(undefined);


// --- Provider Component ---

// Initialize services once at the module level. This is crucial for stability.
const { firebaseApp, firestore, auth } = initializeFirebase();

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 * It separates stable service instances from the dynamic authentication state to prevent
 * unnecessary re-renders and race conditions.
 */
export const FirebaseProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthStateContextState>({
    user: auth.currentUser, // Initialize with current user, if any
    isUserLoading: true,
    userError: null,
  });

  // Set up the authentication state listener. This runs only once.
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
    
    // If onAuthStateChanged hasn't fired but we know there's no user, stop loading.
    // This handles the initial non-logged-in state.
    if (!auth.currentUser && userAuthState.isUserLoading) {
      setUserAuthState(prev => ({ ...prev, isUserLoading: false }));
    }

    return () => unsubscribe(); // Cleanup listener on unmount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The services context value is memoized and NEVER changes. This is the key to stability.
  const servicesValue = useMemo((): FirebaseServicesContextState => ({
    firebaseApp,
    firestore,
    auth,
  }), []);

  return (
    <FirebaseServicesContext.Provider value={servicesValue}>
      <UserAuthStateContext.Provider value={userAuthState}>
        <FirebaseErrorListener />
        {children}
      </UserAuthStateContext.Provider>
    </FirebaseServicesContext.Provider>
  );
};


// --- Service Hooks ---

function useFirebaseServices() {
  const context = useContext(FirebaseServicesContext);
  if (context === undefined) {
    throw new Error('useFirebaseServices must be used within a FirebaseProvider.');
  }
  return context;
}

/** Hook to access Firebase Auth instance. Throws if not available. */
export const useAuth = (): Auth => {
  return useFirebaseServices().auth;
};

/** Hook to access Firestore instance. Throws if not available. */
export const useFirestore = (): Firestore => {
  return useFirebaseServices().firestore;
};

/** Hook to access Firebase App instance. Throws if not available. */
export const useFirebaseApp = (): FirebaseApp => {
  return useFirebaseServices().firebaseApp;
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
 * @returns {UserAuthStateContextState} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserAuthStateContextState => {
  const context = useContext(UserAuthStateContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return context;
};
