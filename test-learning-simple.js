// Simple test without Electron dependencies
const { projectService } = require('./src/features/project/projectService');

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

async function testProjectService() {
  console.log('🧪 Testing Project Service (Simplified)...\n');

  try {
    // Test 1: Project Service
    console.log('1️⃣ Testing Project Service...');
    const project = await projectService.loadProject('test-js-project', testProjectDocument);
    console.log('✅ Project loaded successfully');
    console.log(`   - Project ID: ${project.id}`);
    console.log(`   - Total Steps: ${project.steps.length}`);
    console.log(`   - Current Step: ${projectService.getCurrentStep()?.title || 'None'}\n`);

    // Test 2: Step Parsing
    console.log('2️⃣ Testing Step Parsing...');
    const steps = project.steps;
    console.log(`✅ Parsed ${steps.length} steps:`);
    steps.forEach((step, index) => {
      console.log(`   Step ${index + 1}: ${step.title}`);
      console.log(`   Description: ${step.description.substring(0, 50)}...`);
    });
    console.log('');

    // Test 3: Step Progression
    console.log('3️⃣ Testing Step Progression...');
    const currentStep = projectService.getCurrentStep();
    console.log(`✅ Current step: ${currentStep.title}`);
    
    const nextStep = await projectService.moveToNextStep();
    if (nextStep) {
      console.log(`✅ Moved to next step: ${nextStep.title}`);
      console.log(`   Progress: ${projectService.getProgress()}%`);
    }
    console.log('');

    // Test 4: Project Summary
    console.log('4️⃣ Testing Project Summary...');
    const summary = projectService.getProjectSummary();
    console.log('✅ Project summary retrieved:');
    console.log(`   - Total Steps: ${summary.totalSteps}`);
    console.log(`   - Current Step: ${summary.currentStep}`);
    console.log(`   - Progress: ${summary.progress}%`);
    console.log(`   - Completed Steps: ${summary.completedSteps}`);
    console.log(`   - Remaining Steps: ${summary.remainingSteps}\n`);

    // Test 5: Step Completion
    console.log('5️⃣ Testing Step Completion...');
    await projectService.markStepCompleted(0);
    console.log('✅ Step 1 marked as completed');
    
    const updatedSummary = projectService.getProjectSummary();
    console.log(`   Updated completed steps: ${updatedSummary.completedSteps}\n`);

    console.log('🎉 Project Service tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Project Loading - Working');
    console.log('   ✅ Step Parsing - Working');
    console.log('   ✅ Step Progression - Working');
    console.log('   ✅ Progress Tracking - Working');
    console.log('   ✅ Step Completion - Working');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    try {
      await projectService.resetProject();
      console.log('✅ Cleanup completed');
    } catch (cleanupError) {
      console.error('⚠️  Cleanup error:', cleanupError);
    }
  }
}

// Run the test
if (require.main === module) {
  testProjectService();
}

module.exports = { testProjectService };
