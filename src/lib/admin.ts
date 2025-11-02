import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

let db: admin.firestore.Firestore;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * This function correctly handles both production (with service account key)
 * and local emulator (without credentials) environments.
 */
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (serviceAccountKey) {
    // Production environment: Use service account credentials
    try {
      const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (e: any) {
      console.error('Firebase Admin SDK initialization failed:', e.message);
      throw new Error(
        'Could not initialize Firebase Admin SDK. Ensure FIREBASE_SERVICE_ACCOUNT_KEY is a valid JSON string.'
      );
    }
  } else {
    // Emulator environment: Initialize without credentials.
    // The SDK will automatically connect to emulators if their respective
    // environment variables (e.g., FIREBASE_AUTH_EMULATOR_HOST) are set.
    console.log("Initializing Firebase Admin SDK for emulator environment.");
    admin.initializeApp();
  }
}

/**
 * Returns a memoized instance of the Firestore database from the Admin SDK.
 * It initializes the admin app on the first call.
 */
export function getDb(): admin.firestore.Firestore {
  if (!db) {
    initializeAdminApp();
    db = admin.firestore();
  }
  return db;
}
