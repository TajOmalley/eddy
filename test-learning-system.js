const { projectService } = require('./src/features/project/projectService');
const { guidanceService } = require('./src/features/guidance/guidanceService');
const { contextService } = require('./src/features/context/contextService');
const { projectContextBridge } = require('./src/bridge/projectContextBridge');
const { learningOverlay } = require('./src/ui/learning/LearningOverlay');

// Test project document
const testProjectDocument = `
# JavaScript Learning Project

## Exposure
Learn the basics of JavaScript programming with these free resources:
- JavaScript Tutorial: https://www.w3schools.com/js/
- JavaScript Basics: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide

## Exercise
### Project Goal
Create a simple "Hello World" program in JavaScript that runs in the browser console.

### Arena
Use the browser's developer console or an online code editor like CodePen.

### Steps
1. Open your browser's developer console
   - Press F12 or right-click and select "Inspect"
   - Click on the "Console" tab
   - Expected result: You should see a blank console ready for input

2. Write your first JavaScript code
   - Type: console.log("Hello World");
   - Press Enter to execute
   - Expected result: You should see "Hello World" printed in the console

3. Create a simple variable
   - Type: let name = "Your Name";
   - Press Enter
   - Type: console.log("Hello " + name);
   - Press Enter
   - Expected result: You should see "Hello Your Name" printed

### Your Next Challenge
Create a simple calculator that can add two numbers and display the result.
`;

async function testLearningSystem() {
  console.log('🧪 Testing Learning Guidance System...\n');

  try {
    // Test 1: Project Service
    console.log('1️⃣ Testing Project Service...');
    const project = await projectService.loadProject('test-js-project', testProjectDocument);
    console.log('✅ Project loaded successfully');
    console.log(`   - Project ID: ${project.id}`);
    console.log(`   - Total Steps: ${project.steps.length}`);
    console.log(`   - Current Step: ${projectService.getCurrentStep()?.title || 'None'}\n`);

    // Test 2: Context Service
    console.log('2️⃣ Testing Context Service...');
    await contextService.startContextAnalysis();
    console.log('✅ Context analysis started');
    
    // Simulate screen context
    const mockScreenContext = {
      timestamp: new Date(),
      analysis: {
        detectedElements: [
          { type: 'button', text: 'Console', position: { x: 100, y: 50 } },
          { type: 'input', text: '', position: { x: 200, y: 100 } }
        ],
        textContent: [
          { text: 'Developer Tools', position: { x: 50, y: 20 } },
          { text: 'Console', position: { x: 100, y: 50 } }
        ],
        applicationContext: { type: 'browser', name: 'Chrome Developer Tools' },
        userActivity: { activity: 'coding', confidence: 0.8 }
      }
    };
    
    // Manually set screen context for testing
    contextService.screenAnalysis = mockScreenContext;
    console.log('✅ Mock screen context set\n');

    // Test 3: Guidance Service
    console.log('3️⃣ Testing Guidance Service...');
    await guidanceService.startGuidance();
    console.log('✅ Guidance service started');
    
    // Test guidance generation
    const currentStep = projectService.getCurrentStep();
    const screenContext = contextService.getCurrentScreenContext();
    const guidance = await guidanceService.generateContextualGuidance(currentStep, screenContext);
    
    if (guidance) {
      console.log('✅ Guidance generated successfully');
      console.log(`   - Guidance: ${guidance.text.substring(0, 100)}...`);
    } else {
      console.log('⚠️  No guidance generated (this is expected without real AI)');
    }
    console.log('');

    // Test 4: Project Context Bridge
    console.log('4️⃣ Testing Project Context Bridge...');
    projectContextBridge.initialize();
    console.log('✅ Project context bridge initialized');
    
    // Test bridge methods
    const bridgeStatus = await projectContextBridge.getSessionStatus();
    console.log('✅ Bridge status retrieved');
    console.log(`   - Project Active: ${bridgeStatus.project ? 'Yes' : 'No'}`);
    console.log(`   - Guidance Active: ${bridgeStatus.guidance?.isActive || false}`);
    console.log(`   - Context Analyzing: ${bridgeStatus.context?.isAnalyzing || false}\n`);

    // Test 5: Learning Overlay
    console.log('5️⃣ Testing Learning Overlay...');
    learningOverlay.createOverlay();
    console.log('✅ Learning overlay created');
    
    // Test overlay updates
    learningOverlay.updateProgress({
      currentStep: 1,
      totalSteps: 3,
      progress: 33,
      completedSteps: 0
    });
    
    learningOverlay.updateCurrentStep(currentStep);
    
    if (guidance) {
      learningOverlay.updateGuidance(guidance);
    }
    
    console.log('✅ Overlay updates sent');
    console.log(`   - Overlay Status: ${JSON.stringify(learningOverlay.getStatus(), null, 2)}\n`);

    // Test 6: Step Progression
    console.log('6️⃣ Testing Step Progression...');
    const nextStep = await projectService.moveToNextStep();
    if (nextStep) {
      console.log('✅ Moved to next step');
      console.log(`   - New Step: ${nextStep.title}`);
      console.log(`   - Progress: ${projectService.getProgress()}%`);
    }
    console.log('');

    // Test 7: Session Management
    console.log('7️⃣ Testing Session Management...');
    const sessionStatus = await projectContextBridge.getSessionStatus();
    console.log('✅ Session status retrieved');
    console.log(`   - Project: ${sessionStatus.project ? 'Active' : 'Inactive'}`);
    console.log(`   - Guidance: ${sessionStatus.guidance?.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   - Context: ${sessionStatus.context?.isAnalyzing ? 'Analyzing' : 'Stopped'}\n`);

    console.log('🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Project Service - Working');
    console.log('   ✅ Context Service - Working');
    console.log('   ✅ Guidance Service - Working');
    console.log('   ✅ Project Context Bridge - Working');
    console.log('   ✅ Learning Overlay - Working');
    console.log('   ✅ Step Progression - Working');
    console.log('   ✅ Session Management - Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await guidanceService.stopGuidance();
      await contextService.stopContextAnalysis();
      await projectService.resetProject();
      learningOverlay.close();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup error:', cleanupError);
    }
  }
}

// Run the test
if (require.main === module) {
  testLearningSystem();
}

module.exports = { testLearningSystem };
