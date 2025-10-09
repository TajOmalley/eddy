const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const firebaseConfig = require('./firebase-config');

async function testFirebaseSimple() {
  console.log('🔥 Testing Firebase with simple document...\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Create a very simple test document
    const testData = {
      message: 'Hello Firebase!',
      timestamp: new Date().toISOString(),
      test: true
    };
    
    // Write to a simple collection
    const testRef = doc(collection(db, 'test'));
    await setDoc(testRef, testData);
    
    console.log('✅ Test document created successfully');
    console.log('✅ Firebase is working correctly!\n');
    
    console.log('📋 Your Firebase setup is complete!');
    console.log('You can now use the FirebaseProjectService to manage learning projects.');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your Firebase project has Firestore enabled');
    console.log('2. Check that your .env.local file has the correct Firebase config');
    console.log('3. Ensure Firestore is in test mode (not production mode)');
  }
}

testFirebaseSimple();
