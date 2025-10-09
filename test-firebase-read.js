const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const firebaseConfig = require('./firebase-config');

async function testFirebaseRead() {
  console.log('🔥 Testing Firebase read access...\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Try to read from a collection (this should work even if empty)
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    console.log('✅ Successfully connected to Firestore');
    console.log(`📊 Found ${snapshot.size} documents in test collection`);
    
    if (snapshot.size > 0) {
      snapshot.forEach((doc) => {
        console.log(`📄 Document: ${doc.id}`, doc.data());
      });
    }
    
    console.log('\n✅ Firebase is working correctly!');
    console.log('📋 Your Firebase setup is complete!');
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure your Firebase project has Firestore enabled');
    console.log('2. Check that your .env.local file has the correct Firebase config');
    console.log('3. Ensure Firestore is in test mode (not production mode)');
    console.log('4. Check if there are any Firestore security rules blocking access');
  }
}

testFirebaseRead();
