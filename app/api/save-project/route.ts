import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { title, content, topic, userId } = await request.json();

    if (!title || !content || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Initialize Firebase dynamically
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');

    const firebaseConfig = {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    // Parse the project content to extract steps
    const steps = parseProjectSteps(content);
    
    const projectData = {
      title,
      content,
      topic: topic || 'General',
      steps,
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
      metadata: {
        difficulty: 'beginner',
        duration: '30 minutes',
        status: 'active'
      }
    };

    // Save to Firebase
    const docRef = await addDoc(collection(db, 'projects'), projectData);

    return NextResponse.json({ 
      success: true, 
      projectId: docRef.id,
      message: 'Project saved successfully' 
    });

  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json({ error: 'Failed to save project' }, { status: 500 });
  }
}

function parseProjectSteps(content: string) {
  const steps: any[] = [];
  const lines = content.split('\n');
  let currentStep: any = null;
  let stepNumber = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Check if this is a step header (e.g., "1. Open browser console")
    const stepMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
    if (stepMatch) {
      // Save previous step if exists
      if (currentStep) {
        steps.push(currentStep);
      }
      
      // Start new step
      stepNumber = parseInt(stepMatch[1]);
      currentStep = {
        id: stepNumber,
        title: stepMatch[2],
        content: '',
        completed: false,
        subSteps: []
      };
    } else if (currentStep && trimmedLine.startsWith('- ')) {
      // This is a sub-step
      currentStep.subSteps.push(trimmedLine.substring(2));
    } else if (currentStep && trimmedLine) {
      // This is additional content for the current step
      currentStep.content += (currentStep.content ? '\n' : '') + trimmedLine;
    }
  }

  // Add the last step
  if (currentStep) {
    steps.push(currentStep);
  }

  return steps;
}
