# Learning Guidance System - Local Testing

## 🧪 Testing the Real-time Learning System

This guide will help you test the new learning guidance system locally before deploying.

## 📋 What We Built

### Core Components
- **Project Service**: Manages learning project documents and step progression
- **Context Service**: Analyzes screen content to understand what user is doing
- **Guidance Service**: Provides real-time, contextual learning guidance
- **Project Context Bridge**: Communication layer between components
- **Learning Overlay**: Visual guidance interface

### Key Features
- **Real-time Screen Analysis**: Watches what user is doing
- **Contextual Guidance**: AI-powered help based on current situation
- **Step-by-step Learning**: Structured project progression
- **Visual Overlay**: Always-visible learning assistant

## 🚀 Quick Start Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Learning System Test
```bash
npm run test:learning
```

This will test all components without requiring the full Electron app.

### 3. Test with Electron (Full System)
```bash
npm run test:electron
```

This tests the complete system including screen capture.

## 🔧 Test Components

### Project Service Test
- ✅ Loads project documents
- ✅ Parses step-by-step instructions
- ✅ Tracks user progress
- ✅ Manages step transitions

### Context Service Test
- ✅ Analyzes screen content
- ✅ Detects UI elements
- ✅ Identifies user activity
- ✅ Matches context to project steps

### Guidance Service Test
- ✅ Generates contextual guidance
- ✅ Provides real-time help
- ✅ Tracks guidance history
- ✅ Manages overlay display

### Bridge Communication Test
- ✅ IPC communication between processes
- ✅ Project state management
- ✅ Guidance delivery
- ✅ Progress tracking

## 📊 Expected Test Results

When you run `npm run test:learning`, you should see:

```
🧪 Testing Learning Guidance System...

1️⃣ Testing Project Service...
✅ Project loaded successfully
   - Project ID: test-js-project
   - Total Steps: 3
   - Current Step: Step 1: Open your browser's developer console

2️⃣ Testing Context Service...
✅ Context analysis started
✅ Mock screen context set

3️⃣ Testing Guidance Service...
✅ Guidance service started
✅ Guidance generated successfully
   - Guidance: Based on your current screen, you should look for the Developer Tools...

4️⃣ Testing Project Context Bridge...
✅ Project context bridge initialized
✅ Bridge status retrieved
   - Project Active: Yes
   - Guidance Active: true
   - Context Analyzing: true

5️⃣ Testing Learning Overlay...
✅ Learning overlay created
✅ Overlay updates sent

6️⃣ Testing Step Progression...
✅ Moved to next step
   - New Step: Step 2: Write your first JavaScript code
   - Progress: 67%

7️⃣ Testing Session Management...
✅ Session status retrieved
   - Project: Active
   - Guidance: Active
   - Context: Analyzing

🎉 All tests completed successfully!
```

## 🐛 Troubleshooting

### Common Issues

1. **Module Not Found Errors**
   - Ensure all dependencies are installed: `npm install`
   - Check file paths in require statements

2. **Firebase Connection Errors**
   - Set up environment variables for Firebase
   - Or modify services to work without Firebase for testing

3. **Electron Window Errors**
   - Ensure Electron is properly installed
   - Check window creation permissions

### Debug Mode
Add `console.log` statements to track execution flow:

```javascript
console.log('[Debug] Starting test...');
console.log('[Debug] Project loaded:', project);
console.log('[Debug] Context analysis:', context);
```

## 🔄 Integration with Existing Glass App

The learning system integrates with your existing Glass infrastructure:

- **Screen Capture**: Uses existing `listenService`
- **AI Processing**: Leverages existing `askService`
- **Window Management**: Extends existing window system
- **Data Storage**: Uses existing repository pattern

## 📈 Next Steps

After successful local testing:

1. **Integrate with Main App**: Add learning features to main Glass interface
2. **Deploy to Production**: Push changes to GitHub
3. **User Testing**: Test with real learning projects
4. **Performance Optimization**: Optimize for real-world usage

## 🎯 Success Criteria

The system is working correctly when:
- ✅ Project documents load and parse correctly
- ✅ Screen context is analyzed in real-time
- ✅ Guidance is generated based on current situation
- ✅ Visual overlay displays helpful information
- ✅ Step progression works smoothly
- ✅ All components communicate properly

Ready to test? Run `npm run test:learning` to get started! 🚀
