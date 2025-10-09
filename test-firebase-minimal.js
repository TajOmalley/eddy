const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const firebaseConfig = require('./firebase-config');

async function testFirebaseMinimal() {
  console.log('🔥 Testing Firebase with minimal write...\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Try to write a minimal document
    const minimalData = {
      test: 'hello'
    };
    
    // Use a simple document ID
    const testRef = doc(db, 'test', 'minimal-test');
    await setDoc(testRef, minimalData);
    
    console.log('✅ Minimal document written successfully');
    console.log('✅ Firebase write operations are working!');
    
  } catch (error) {
    console.error('❌ Firebase write test failed:', error);
    console.log('\n🔧 Possible issues:');
    console.log('1. Firestore security rules might be blocking writes');
    console.log('2. Check if Firestore is in test mode vs production mode');
    console.log('3. Verify your Firebase project configuration');
  }
}

testFirebaseMinimal();
