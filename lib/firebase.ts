// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Lazy initialization to avoid SSR issues
let app: any = null;
let db: any = null;
let auth: any = null;

export const getFirebaseApp = async () => {
  if (typeof window === 'undefined') return null;
  
  if (!app) {
    const { initializeApp, getApps } = await import('firebase/app');
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
};

export const getFirestore = async () => {
  if (typeof window === 'undefined') return null;
  
  if (!db) {
    const { getFirestore } = await import('firebase/firestore');
    const app = await getFirebaseApp();
    if (app) db = getFirestore(app);
  }
  return db;
};

export const getAuth = async () => {
  if (typeof window === 'undefined') return null;
  
  if (!auth) {
    const { getAuth } = await import('firebase/auth');
    const app = await getFirebaseApp();
    if (app) auth = getAuth(app);
  }
  return auth;
};

// For backward compatibility
export { getFirestore as db, getAuth as auth };
export default getFirebaseApp;
