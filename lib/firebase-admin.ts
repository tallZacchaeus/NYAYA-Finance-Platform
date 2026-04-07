import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';

type FirebaseAdminEnvName =
  | 'FIREBASE_PROJECT_ID'
  | 'FIREBASE_CLIENT_EMAIL'
  | 'FIREBASE_PRIVATE_KEY';

function getRequiredFirebaseAdminEnv(name: FirebaseAdminEnvName) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required Firebase Admin environment variable: ${name}`);
  }

  return value;
}

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

  return initializeApp({
    credential: cert({
      projectId: getRequiredFirebaseAdminEnv('FIREBASE_PROJECT_ID'),
      clientEmail: getRequiredFirebaseAdminEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: getRequiredFirebaseAdminEnv('FIREBASE_PRIVATE_KEY').replace(
        /\\n/g,
        '\n'
      ),
    }),
    ...(storageBucket ? { storageBucket } : {}),
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}
