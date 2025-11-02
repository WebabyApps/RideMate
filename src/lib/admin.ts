import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

let db: admin.firestore.Firestore;

async function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Cannot initialize Admin SDK.');
  }

  try {
    const serviceAccount: ServiceAccount = JSON.parse(serviceAccountKey);
    return admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e: any) {
    console.error('Firebase Admin initialization error:', e);
    throw new Error(
      'Firebase Admin SDK initialization failed. Ensure your FIREBASE_SERVICE_ACCOUNT_KEY is a valid JSON string.'
    );
  }
}

export async function getDb(): Promise<admin.firestore.Firestore> {
  if (!db) {
    await initializeAdminApp();
    db = admin.firestore();
  }
  return db;
}
