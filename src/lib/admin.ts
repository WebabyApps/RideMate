import * as admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

// This prevents re-initialization in hot-reload environments
if (admin.apps.length === 0) {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    // Production: use the service account key
    try {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e: any) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', e.message);
        throw new Error('Firebase Admin SDK initialization failed. Ensure your service account key is set correctly.');
    }
  } else if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    // Local development: connect to emulators
    // The SDK automatically detects emulator env vars (like FIREBASE_AUTH_EMULATOR_HOST)
    // and connects. No credentials are required.
    console.log("No service account key found. Initializing Admin SDK for local emulator environment.");
    admin.initializeApp();
  } else {
    // Fallback/Error case if no config is found
    console.warn("Firebase Admin SDK is not configured. Missing FIREBASE_SERVICE_ACCOUNT_KEY for production or emulator variables for local development.");
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };

/**
 * Returns a memoized instance of the Firestore database from the Admin SDK.
 */
export function getDb(): admin.firestore.Firestore {
  return db;
}
