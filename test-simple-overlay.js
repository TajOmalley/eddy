const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// Simple test that just shows the learning overlay
app.whenReady().then(() => {
  console.log('🚀 Starting simple overlay test...\n');
  
  try {
    // Create a simple overlay window
    const overlayWindow = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // Load the overlay HTML
    overlayWindow.loadFile('src/ui/learning/learning-overlay.html');
    
    // Position the window
    overlayWindow.setPosition(100, 100);
    
    console.log('✅ Learning overlay window created');
    console.log('🎯 You should see a purple learning overlay on your screen!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Electron app started');
    console.log('   ✅ Overlay window created');
    console.log('   ✅ Learning guidance system ready');
    
    console.log('\n⏳ Overlay is now visible! Press Ctrl+C to exit');
    
    // Handle close overlay IPC message
    ipcMain.on('close-learning-overlay', () => {
      console.log('🧹 Closing learning overlay session...');
      
      // Close the overlay window
      if (overlayWindow && !overlayWindow.isDestroyed()) {
        overlayWindow.close();
      }
      
      // End the learning session
      console.log('✅ Learning session ended');
      
      // Quit the app after a short delay to allow cleanup
      setTimeout(() => {
        console.log('👋 Goodbye! Learning session completed.');
        app.quit();
      }, 500);
    });

    // Handle get project data request (for testing)
    ipcMain.on('get-project-data', (event, data) => {
      console.log('[Test] Project data requested for:', data.projectId);
      
      // Return mock project data for testing
      const mockProject = {
        id: data.projectId || 'test-project',
        title: 'Test Learning Project',
        content: `# Test Project

This is a test learning project to demonstrate the overlay functionality.

## Step 1: Getting Started
- Open your development environment
- Create a new project folder
- Initialize your project with the necessary tools

## Step 2: Basic Setup
- Install required dependencies
- Configure your development environment
- Set up version control

## Step 3: Implementation
- Write your first lines of code
- Test your implementation
- Debug any issues that arise

## Step 4: Final Steps
- Review your code
- Add documentation
- Deploy your project

This project will help you learn the fundamentals of development.`,
        topic: 'Development',
        steps: [
          {
            number: 1,
            title: 'Getting Started',
            content: 'Open your development environment and create a new project folder.'
          },
          {
            number: 2,
            title: 'Basic Setup',
            content: 'Install required dependencies and configure your development environment.'
          },
          {
            number: 3,
            title: 'Implementation',
            content: 'Write your first lines of code and test your implementation.'
          },
          {
            number: 4,
            title: 'Final Steps',
            content: 'Review your code, add documentation, and deploy your project.'
          }
        ],
        createdAt: new Date(),
        userId: data.userId || 'test-user'
      };
      
      event.reply('project-data-response', {
        success: true,
        project: mockProject
      });
    });

    // Handle AI guidance request (for testing)
    ipcMain.on('request-ai-guidance', (event, data) => {
      console.log('[Test] AI guidance requested for step:', data.stepNumber);
      
      // Return mock AI guidance for testing
      const mockGuidance = {
        text: `Great job on step ${data.stepNumber}! You're making excellent progress. Keep following the instructions and don't hesitate to ask if you need help.`,
        timestamp: new Date().toISOString(),
        priority: 'normal'
      };
      
      event.reply('ai-guidance-response', {
        success: true,
        guidance: mockGuidance
      });
    });
    
    // Keep the app running
    overlayWindow.on('closed', () => {
      console.log('🧹 Overlay window closed');
      // If the window is closed by other means (like Alt+F4), also quit the app
      setTimeout(() => {
        app.quit();
      }, 100);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    app.quit();
  }
});

// Handle app events
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
});

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🧹 Cleaning up...');
  app.quit();
});