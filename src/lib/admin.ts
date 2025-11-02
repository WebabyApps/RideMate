import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

let db: admin.firestore.Firestore;

/**
 * Initializes the Firebase Admin SDK if not already initialized.
 * It uses the service account key from the `FIREBASE_SERVICE_ACCOUNT_KEY` 
 * environment variable, which is the standard and most reliable method for both
 * local development (with emulators) and production environments.
 * The Admin SDK automatically detects the `FIREBASE_AUTH_EMULATOR_HOST` 
 * environment variable for token verification against the emulator.
 */
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    // In a deployed Google Cloud environment (like App Hosting),
    // Application Default Credentials would be used automatically if this key is missing.
    // For local dev, this key is essential.
    console.warn(
      'FIREBASE_SERVICE_ACCOUNT_KEY is not set. Using Application Default Credentials. This is expected in a deployed environment, but might fail locally if gcloud auth is not configured.'
    );
    admin.initializeApp();
    return;
  }

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
