import * as admin from 'firebase-admin';

let db: admin.firestore.Firestore;

async function initialize() {
  if (admin.apps.length > 0) {
    db = admin.firestore();
    return;
  }

  try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
      // Initialize with service account key if provided (local dev)
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccountKey)),
      });
    } else {
      // Initialize with Application Default Credentials (deployed environment)
      admin.initializeApp();
    }
  } catch (e) {
    console.error('Firebase Admin initialization error:', e);
    throw new Error(
      'Firebase Admin SDK initialization failed. Ensure your environment is configured with the correct credentials.'
    );
  }

  db = admin.firestore();
}

export async function getDb() {
  if (!db) {
    await initialize();
  }
  return db;
}
