const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc } = require('firebase/firestore');
const firebaseConfig = require('./firebase-config');

async function setupFirebase() {
  console.log('🔥 Setting up Firebase for LearnCanvas...\n');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Test connection by creating a test document
    const testProject = {
      id: 'test-project-001',
      title: 'Test Project',
      content: '# Test Project\n\nThis is a test project to verify Firebase connection.',
      steps: [
        {
          id: 1,
          title: 'Test Step 1',
          content: 'This is a test step',
          completed: false
        }
      ],
      metadata: {
        difficulty: 'beginner',
        duration: '5 minutes',
        topic: 'testing'
      },
      authorId: 'test-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
    
    // Create test project
    const projectRef = doc(collection(db, 'projects'), testProject.id);
    await setDoc(projectRef, testProject);
    
    console.log('✅ Test project created successfully');
    console.log('✅ Firebase setup complete!\n');
    
    console.log('📋 Next steps:');
    console.log('1. Go to https://console.firebase.google.com');
    console.log('2. Create a new project');
    console.log('3. Enable Firestore Database');
    console.log('4. Get your Firebase config');
    console.log('5. Update your .env file with the config values');
    
  } catch (error) {
    console.error('❌ Firebase setup failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure you have a Firebase project created');
    console.log('2. Check your Firebase config in firebase-config.js');
    console.log('3. Ensure Firestore is enabled in your Firebase project');
  }
}

// Run setup if called directly
if (require.main === module) {
  setupFirebase();
}

module.exports = setupFirebase;
