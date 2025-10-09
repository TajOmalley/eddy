// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Firebase configuration for LearnCanvas
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.replace(/"/g, '').replace(/,/g, ''),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.replace(/"/g, '').replace(/,/g, ''),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.replace(/"/g, '').replace(/,/g, ''),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.replace(/"/g, '').replace(/,/g, ''),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.replace(/"/g, '').replace(/,/g, ''),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.replace(/"/g, '').replace(/,/g, ''),
  measurementId: process.env.FIREBASE_MEASUREMENT_ID?.replace(/"/g, '').replace(/,/g, '')
};

module.exports = firebaseConfig;
