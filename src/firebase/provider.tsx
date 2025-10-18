'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { initializeFirebase as getServices } from '@/firebase'; // Renamed for clarity
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

export const FirebaseProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  // The services are now retrieved from the memoized function call
  const services = useMemo(() => getServices(), []);

  const [userAuthState, setUserAuthState] = useState<UserAuthStateContextState>({
    user: services.auth.currentUser, 
    isUserLoading: true,
    userError: null,
  });

  // Set up the authentication state listener. This runs only once.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      services.auth,
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
  }, [services.auth]);

  return (
    <FirebaseServicesContext.Provider value={services}>
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