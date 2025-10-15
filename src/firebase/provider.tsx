'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { auth as singletonAuth, firestore as singletonFirestore, firebaseApp as singletonApp } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

// --- Context Definitions ---

interface FirebaseServicesContextState {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthStateContextState {
  user: User | null;
  isUserLoading: boolean; 
  userError: Error | null; 
}

// --- Context Creation ---
const FirebaseServicesContext = createContext<FirebaseServicesContextState | undefined>(undefined);
const UserAuthStateContext = createContext<UserAuthStateContextState | undefined>(undefined);


// --- Provider Component ---

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 * It uses the singleton instances of services initialized outside of the React tree for stability.
 */
export const FirebaseProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthStateContextState>({
    user: singletonAuth.currentUser, 
    isUserLoading: true,
    userError: null,
  });

  // Set up the authentication state listener. This runs only once.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      singletonAuth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    
    // Cleanup listener on unmount
    return () => unsubscribe(); 
  }, []);

  // The services context value is memoized with the singleton instances and NEVER changes.
  const servicesValue = useMemo((): FirebaseServicesContextState => ({
    firebaseApp: singletonApp,
    firestore: singletonFirestore,
    auth: singletonAuth,
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

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  return useFirebaseServices().auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  return useFirebaseServices().firestore;
};

/** Hook to access Firebase App instance. */
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
 * Hook for accessing the authenticated user's state.
 * @returns {UserAuthStateContextState} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserAuthStateContextState => {
  const context = useContext(UserAuthStateContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return context;
};