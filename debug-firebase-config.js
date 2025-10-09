const firebaseConfig = require('./firebase-config');

console.log('🔍 Debugging Firebase Configuration...\n');

console.log('Firebase Config:');
console.log('API Key:', firebaseConfig.apiKey ? '✅ Set' : '❌ Missing');
console.log('Auth Domain:', firebaseConfig.authDomain ? '✅ Set' : '❌ Missing');
console.log('Project ID:', firebaseConfig.projectId ? '✅ Set' : '❌ Missing');
console.log('Storage Bucket:', firebaseConfig.storageBucket ? '✅ Set' : '❌ Missing');
console.log('Messaging Sender ID:', firebaseConfig.messagingSenderId ? '✅ Set' : '❌ Missing');
console.log('App ID:', firebaseConfig.appId ? '✅ Set' : '❌ Missing');
console.log('Measurement ID:', firebaseConfig.measurementId ? '✅ Set' : '❌ Missing');

console.log('\nFull Config:');
console.log(JSON.stringify(firebaseConfig, null, 2));

// Check for common issues
console.log('\n🔍 Checking for common issues:');
if (firebaseConfig.projectId && firebaseConfig.projectId.includes('your-project')) {
  console.log('❌ Project ID still contains placeholder text');
}
if (firebaseConfig.apiKey && firebaseConfig.apiKey.includes('your-api-key')) {
  console.log('❌ API Key still contains placeholder text');
}
if (!firebaseConfig.projectId) {
  console.log('❌ Project ID is missing');
}
if (!firebaseConfig.apiKey) {
  console.log('❌ API Key is missing');
}

console.log('\n📋 Next steps:');
console.log('1. Make sure your .env.local file has real Firebase config values');
console.log('2. Check that the Firebase project exists and Firestore is enabled');
console.log('3. Verify the project ID matches your Firebase project');
