
'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { firebaseApp, auth, firestore } from '@/firebase'; // Directly import the initialized services

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * FirebaseClientProvider is a client-side component that wraps the main
 * FirebaseProvider. It ensures that the Firebase services are passed
 * down the component tree correctly on the client.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Since firebaseApp, auth, and firestore are now initialized as singletons
  // in `src/firebase/index.ts`, we can import them directly.
  // This avoids re-running initialization logic in the component.

  // We can add a check to ensure services are available, although direct
  // import makes this very reliable.
  if (!firebaseApp || !auth || !firestore) {
    // This case should ideally not be hit if index.ts is correct.
    // You could render a loading indicator here.
    return <div>Loading Firebase...</div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
