// try {
//     const reloader = require('electron-reloader');
//     reloader(module, {
//     });
// } catch (err) {
// }

require('dotenv').config({ path: '.env.local' });

// Optional squirrel startup handling (only for packaged apps)
try {
if (require('electron-squirrel-startup')) {
    process.exit(0);
    }
} catch (error) {
    // electron-squirrel-startup is not available in development
    console.log('[Main] Running in development mode - squirrel startup not needed');
}

const { app, BrowserWindow, shell, ipcMain, dialog, desktopCapturer, session } = require('electron');
const { createWindows } = require('./window/windowManager.js');
const listenService = require('./features/listen/listenService');
const { initializeFirebase } = require('./features/common/services/firebaseClient');
const databaseInitializer = require('./features/common/services/databaseInitializer');
const authService = require('./features/common/services/authService');
const path = require('node:path');
const express = require('express');
const fetch = require('node-fetch');
const { autoUpdater } = require('electron-updater');
const { EventEmitter } = require('events');
const askService = require('./features/ask/askService');
const settingsService = require('./features/settings/settingsService');
const sessionRepository = require('./features/common/repositories/session');
const modelStateService = require('./features/common/services/modelStateService');
const featureBridge = require('./bridge/featureBridge');
const windowBridge = require('./bridge/windowBridge');
const projectService = require('./features/project/projectService');
const guidanceService = require('./features/guidance/guidanceService');
const learningOverlayManager = require('./ui/learning/learningOverlayManager');

// Global variables
const eventBridge = new EventEmitter();
let WEB_PORT = 3000;
let isShuttingDown = false; // Flag to prevent infinite shutdown loop
let launchProjectId = null;
let launchUserId = null;
let currentProject = null;

// Check for launch parameters
function checkLaunchParameters() {
    const args = process.argv;
    console.log('[Launch] Process arguments:', args);
    
    // Check for --project-id and --user-id arguments
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--project-id' && args[i + 1]) {
            launchProjectId = args[i + 1];
            console.log('[Launch] Project ID from arguments:', launchProjectId);
        }
        if (args[i] === '--user-id' && args[i + 1]) {
            launchUserId = args[i + 1];
            console.log('[Launch] User ID from arguments:', launchUserId);
        }
    }
    
    // Check environment variables as fallback
    if (!launchProjectId && process.env.LAUNCH_PROJECT_ID) {
        launchProjectId = process.env.LAUNCH_PROJECT_ID;
        console.log('[Launch] Project ID from environment:', launchProjectId);
    }
    if (!launchUserId && process.env.LAUNCH_USER_ID) {
        launchUserId = process.env.LAUNCH_USER_ID;
        console.log('[Launch] User ID from environment:', launchUserId);
    }
    }

    // Handle protocol URLs on Windows/Linux
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        console.log('[Protocol] Second instance command line:', commandLine);
        
    // Look for protocol URLs in command line arguments
    const protocolUrl = commandLine.find(arg => arg.startsWith('pickleglass://'));
    if (protocolUrl) {
        console.log('[Protocol] Found protocol URL in second instance:', protocolUrl);
        handleCustomUrl(protocolUrl);
    }
    
    // Check for launch parameters in second instance
    const projectIdArg = commandLine.find(arg => arg.startsWith('--project-id'));
    const userIdArg = commandLine.find(arg => arg.startsWith('--user-id'));
    
    if (projectIdArg || userIdArg) {
        console.log('[Launch] Found launch parameters in second instance');
        // Focus the existing window instead of creating a new one
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            windows[0].focus();
        }
        }
    });

    // Handle protocol URLs on macOS
    app.on('open-url', (event, url) => {
        event.preventDefault();
        console.log('[Protocol] Received URL via open-url:', url);
            handleCustomUrl(url);
});

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
    console.log('🚀 Electron app starting...');
    
    // Check for launch parameters first
    checkLaunchParameters();
    
    try {
        // Initialize database first
        await databaseInitializer.initialize();
        console.log('✅ Database initialized');
        
        // Initialize Firebase
        await initializeFirebase();
        console.log('✅ Firebase initialized');

        // Initialize authentication service
        await authService.initialize();
        console.log('✅ Authentication service initialized');

        // Initialize model state service
        await modelStateService.initialize();
        console.log('✅ Model state service initialized');

        // Initialize feature bridge
        await featureBridge.initialize();
        console.log('✅ Feature bridge initialized');

        // Initialize window bridge
        await windowBridge.initialize();
        console.log('✅ Window bridge initialized');

        // Project service is ready to use (no initialization needed)
        console.log('✅ Project service ready');

        // Guidance service is ready to use (no initialization needed)
        console.log('✅ Guidance service ready');

        // Initialize settings service
        await settingsService.initialize();
        console.log('✅ Settings service initialized');

        // Ask service is ready to use (no initialization needed)
        console.log('✅ Ask service ready');

        // Initialize listen service
        await listenService.initialize();
        console.log('✅ Listen service initialized');

        // Set up web data handlers
        setupWebDataHandlers();
        console.log('✅ Web data handlers set up');

        // Set up custom URL handlers
        setupCustomUrlHandlers();
        console.log('✅ Custom URL handlers set up');

        // Set up launch project handlers
        setupLaunchProjectHandlers();
        console.log('✅ Launch project handlers set up');

        // Set up IPC handlers
        setupIpcHandlers();
        console.log('✅ IPC handlers set up');

        // Check for updates in the background
        checkForUpdates();

        // Start web server and create windows ONLY after all initializations are successful
        WEB_PORT = await startWebStack();
        console.log('Web front-end listening on', WEB_PORT);
        
        // Use learning overlay system instead of old window system
        console.log('[Main] Learning overlay system ready - waiting for project launch...');

        // If we have launch parameters, automatically launch the project
        if (launchProjectId && launchUserId) {
            console.log(`[Launch] Auto-launching project ${launchProjectId} for user ${launchUserId}`);
            setTimeout(async () => {
                try {
                    await handleLaunchProject({
                        projectId: launchProjectId,
                        userId: launchUserId,
                        timestamp: new Date().toISOString(),
                        source: 'launch-args'
                    });
                } catch (error) {
                    console.error('[Launch] Error auto-launching project:', error);
                }
            }, 5000); // Wait 5 seconds for everything to initialize
        }

        console.log('🎉 All services initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize services:', error);
        
        // Show error dialog to user
        dialog.showErrorBox(
            'Initialization Error',
            `Failed to initialize the application: ${error.message}\n\nPlease restart the application.`
        );
        
        // Exit the application
        app.quit();
    }
});

function setupIpcHandlers() {
    // Handle close learning overlay IPC message
    ipcMain.on('close-learning-overlay', () => {
        console.log('🧹 Closing learning overlay session...');
        learningOverlayManager.closeOverlay();
        console.log('✅ Learning session ended');
    });

    ipcMain.on('resize-overlay', (event, { height }) => {
        console.log('[Main] Resize overlay requested:', height);
        if (learningOverlayManager && learningOverlayManager.overlayWindow) {
            const currentBounds = learningOverlayManager.overlayWindow.getBounds();
            learningOverlayManager.overlayWindow.setBounds({
                x: currentBounds.x,
                y: currentBounds.y,
                width: currentBounds.width,
                height: height
            });
        }
    });

    // Handle get project data request
    ipcMain.on('get-project-data', async (event) => {
        try {
            console.log('[IPC] Getting project data');
            
            // Return current project from overlay manager
            if (learningOverlayManager.currentProject) {
                const project = learningOverlayManager.currentProject;
                console.log('[IPC] Project loaded from overlay manager:', project.document?.title || 'Unknown Title');
                
                event.reply('project-data-response', {
                    success: true,
                    project: {
                        id: project.id,
                        title: project.document?.title || 'Untitled Project',
                        content: project.document?.content || project.document,
                        topic: project.document?.topic || 'General',
                        steps: project.steps || [],
                        progress: learningOverlayManager.calculateProgress(),
                        createdAt: project.document?.createdAt || new Date(),
                        userId: project.document?.userId || 'current-user'
                    }
                });
            } else {
                console.log('[IPC] No project data available');
                event.reply('project-data-response', {
                    success: false,
                    error: 'No project data available'
                });
            }
        } catch (error) {
            console.error('[IPC] Error loading project:', error);
            event.reply('project-data-response', {
                success: false,
                error: error.message
            });
        }
    });

    // Handle AI guidance request
    ipcMain.on('request-ai-guidance', async (event, data) => {
        try {
            console.log('[IPC] Requesting AI guidance for step:', data.stepNumber);
            
            const guidance = await getAIGuidance(data.stepContent, data.projectContext);
            
            event.reply('ai-guidance-response', {
                success: true,
                guidance: guidance
            });
        } catch (error) {
            console.error('[IPC] Error getting AI guidance:', error);
            event.reply('ai-guidance-response', {
                success: false,
                error: error.message
            });
        }
    });
}

// Get AI guidance using OpenAI API
async function getAIGuidance(stepContent, projectContext) {
    try {
        const openaiApiKey = process.env.OPENAI_API_KEY;
        if (!openaiApiKey) {
            throw new Error('OpenAI API key not found');
        }

        const prompt = `You are a helpful learning assistant. The user is working on a learning project with the following context:

Project Context: ${projectContext}

Current Step: ${stepContent}

Please provide helpful guidance for this step. Be encouraging, specific, and actionable. Keep your response concise (2-3 sentences) and focus on what the user should do next.`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a helpful learning assistant that provides clear, actionable guidance for learning projects.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 150,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const guidance = data.choices[0].message.content;

        return {
            text: guidance,
            timestamp: new Date().toISOString(),
            priority: 'normal'
        };

    } catch (error) {
        console.error('[AI] Error getting guidance:', error);
        return {
            text: 'I\'m here to help! Feel free to ask if you need assistance with this step.',
            timestamp: new Date().toISOString(),
            priority: 'low'
        };
    }
}

app.on('before-quit', async (event) => {
    // Prevent infinite loop by checking if shutdown is already in progress
    if (isShuttingDown) {
        console.log('[Shutdown] Shutdown already in progress, skipping...');
        return;
    }
    
    isShuttingDown = true;
    console.log('🛑 Application shutting down...');
    
    try {
        // 1. Stop audio capture first (immediate)
        await listenService.closeSession();
        console.log('[Shutdown] Audio capture stopped');
        
        // 2. End all active sessions (database operations) - with error handling
        try {
            await sessionRepository.endAllActiveSessions();
            console.log('[Shutdown] All active sessions ended');
        } catch (error) {
            console.error('[Shutdown] Error ending sessions:', error);
            // Continue with shutdown even if session cleanup fails
        }
        
        // 3. Close all windows gracefully
        const windows = BrowserWindow.getAllWindows();
        for (const window of windows) {
            if (!window.isDestroyed()) {
                window.close();
            }
        }
        console.log('[Shutdown] All windows closed');
        
        // 4. Final cleanup
        console.log('[Shutdown] Cleanup completed');
        
    } catch (error) {
        console.error('[Shutdown] Error during shutdown:', error);
    }
    
    // Force quit after a short delay to ensure cleanup completes
    setTimeout(() => {
        console.log('[Shutdown] Force quitting...');
        app.quit();
    }, 1000);
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        // Learning overlay system doesn't need to recreate windows
        console.log('[Main] App activated - learning overlay system ready');
    }
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

function setupWebDataHandlers() {
    const sessionRepository = require('./features/common/repositories/session');
    const sttRepository = require('./features/listen/stt/repositories');
    const summaryRepository = require('./features/listen/summary/repositories');
    const askRepository = require('./features/ask/repositories');
    const userRepository = require('./features/common/repositories/user');
    const presetRepository = require('./features/common/repositories/preset');
    const modelStateRepository = require('./features/common/repositories/modelState');
    const settingsRepository = require('./features/common/repositories/settings');
    const projectRepository = require('./features/project/repositories');
    const guidanceRepository = require('./features/guidance/repositories');

    const handleRequest = async (data) => {
        const { requestType, requestData, responseChannel } = data;
        
        try {
            let result;
            
            switch (requestType) {
                case 'get-sessions':
                    result = await sessionRepository.getAllSessions();
                    break;
                case 'get-session':
                    result = await sessionRepository.getSession(requestData.id);
                    break;
                case 'create-session':
                    result = await sessionRepository.createSession(requestData);
                        break;
                case 'update-session':
                    result = await sessionRepository.updateSession(requestData.id, requestData);
                    break;
                case 'delete-session':
                    result = await sessionRepository.deleteSession(requestData.id);
                    break;
                case 'get-stt-data':
                    result = await sttRepository.getSttData(requestData.sessionId);
                    break;
                case 'get-summary-data':
                    result = await summaryRepository.getSummaryData(requestData.sessionId);
                    break;
                case 'get-ask-data':
                    result = await askRepository.getAskData(requestData.sessionId);
                    break;
                case 'get-user-data':
                    result = await userRepository.getUserData();
                    break;
                case 'update-user-data':
                    result = await userRepository.updateUserData(requestData);
                    break;
                case 'get-preset-data':
                    result = await presetRepository.getPresetData();
                    break;
                case 'update-preset-data':
                    result = await presetRepository.updatePresetData(requestData);
                    break;
                case 'get-model-state':
                    result = await modelStateRepository.getModelState();
                    break;
                case 'update-model-state':
                    result = await modelStateRepository.updateModelState(requestData);
                    break;
                case 'get-settings':
                    result = await settingsRepository.getSettings();
                    break;
                case 'update-settings':
                    result = await settingsRepository.updateSettings(requestData);
                    break;
                case 'get-project-data':
                    result = await projectRepository.getProjectData(requestData.projectId);
                    break;
                case 'update-project-data':
                    result = await projectRepository.updateProjectData(requestData.projectId, requestData);
                    break;
                case 'get-guidance-data':
                    result = await guidanceRepository.getGuidanceData(requestData.sessionId);
                    break;
                case 'update-guidance-data':
                    result = await guidanceRepository.updateGuidanceData(requestData.sessionId, requestData);
                    break;
                default:
                    throw new Error(`Unknown request type: ${requestType}`);
            }
            
            eventBridge.emit(responseChannel, { success: true, data: result });
        } catch (error) {
            console.error(`Error handling ${requestType}:`, error);
            eventBridge.emit(responseChannel, { success: false, error: error.message });
        }
    };
    
    eventBridge.on('web-data-request', handleRequest);
}

function setupLaunchProjectHandlers() {
    const handleLaunchProject = async (data) => {
        const { projectId, userId, timestamp, source } = data;
        
        try {
            console.log(`[Launch] Handling launch request for project ${projectId} from ${source}`);
            
            // Launch the learning overlay with project data
            const result = await learningOverlayManager.launchOverlay(projectId, userId);
            
            console.log(`[Launch] Successfully launched learning overlay for project ${projectId}`);
            
            // Emit success event back to the API
            eventBridge.emit('launch-project-success', {
                projectId,
                userId,
                timestamp,
                success: true
            });
            
        } catch (error) {
            console.error(`[Launch] Error launching project ${projectId}:`, error);
            
            // Emit error event back to the API
            eventBridge.emit('launch-project-error', {
                projectId,
                userId,
                timestamp,
                error: error.message
            });
        }
    };
    
    eventBridge.on('launch-project', handleLaunchProject);
}

async function handleCustomUrl(url) {
    try {
        console.log('[Custom URL] Processing URL:', url);
        
        // Validate and clean URL
        if (!url || typeof url !== 'string' || !url.startsWith('pickleglass://')) {
            console.error('[Custom URL] Invalid URL format:', url);
            return;
        }
        
        // Clean up URL by removing problematic characters
        const cleanUrl = url.replace(/[\\₩]/g, '');
        
        // Parse the URL to extract action and parameters
        const urlObj = new URL(cleanUrl);
        const action = urlObj.pathname.substring(1); // Remove leading slash
        const params = Object.fromEntries(urlObj.searchParams);
        
        console.log('[Custom URL] Parsed action:', action);
        console.log('[Custom URL] Parsed params:', params);

        // Handle different actions
        switch (action) {
            case 'launch-project':
                const { projectId, userId } = params;
                if (projectId && userId) {
                    console.log(`[Custom URL] Launching project ${projectId} for user ${userId}`);
                    await handleLaunchProject({ projectId, userId, timestamp: new Date().toISOString(), source: 'protocol' });
                } else {
                    console.error('[Custom URL] Missing projectId or userId in launch-project URL');
                }
                break;
                
            case 'settings':
                console.log('[Custom URL] Opening settings');
                openSettings();
                break;
                
            case 'help':
                console.log('[Custom URL] Opening help');
                openHelp();
                break;
                
            default:
                console.log(`[Custom URL] Unknown action: ${action}`);
                break;
        }

    } catch (error) {
        console.error('[Custom URL] Error processing URL:', error);
    }
}

function setupCustomUrlHandlers() {
    // Register the custom protocol
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('pickleglass', process.execPath, [path.resolve(process.argv[1])]);
        }
    } else {
        app.setAsDefaultProtocolClient('pickleglass');
    }
    
    // Handle protocol URLs on Windows/Linux
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        console.log('[Protocol] Second instance command line:', commandLine);
        
        // Look for protocol URLs in command line arguments
        const protocolUrl = commandLine.find(arg => arg.startsWith('pickleglass://'));
        if (protocolUrl) {
            console.log('[Protocol] Found protocol URL in second instance:', protocolUrl);
            handleCustomUrl(protocolUrl);
        }
    });
    
    // Handle protocol URLs on macOS
    app.on('open-url', (event, url) => {
        event.preventDefault();
        console.log('[Protocol] Received URL via open-url:', url);
        handleCustomUrl(url);
    });
}

function openSettings() {
    try {
        const windows = BrowserWindow.getAllWindows();
        let header = null;
        
        for (const window of windows) {
            if (window.webContents.getURL().includes('header')) {
                header = window;
                break;
            }
        }
        
        if (!header) {
            console.log('[Custom URL] Header window not found, creating new one');
            // Learning overlay system doesn't need header windows
            console.log('[Custom URL] Learning overlay system ready');
            
            // Wait a bit for the window to be created
            setTimeout(() => {
                const newWindows = BrowserWindow.getAllWindows();
                for (const window of newWindows) {
                    if (window.webContents.getURL().includes('header')) {
                        header = window;
                        break;
                    }
                }
                
        if (header) {
            header.focus();
                    
                    const personalizeUrl = `http://localhost:${WEB_PORT}/settings`;
                    console.log(`[Custom URL] Navigating to personalize page: ${personalizeUrl}`);
                    header.webContents.loadURL(personalizeUrl);
                }
            }, 1000);
        } else {
            header.focus();
            
            const personalizeUrl = `http://localhost:${WEB_PORT}/settings`;
            console.log(`[Custom URL] Navigating to personalize page: ${personalizeUrl}`);
            header.webContents.loadURL(personalizeUrl);
        }
    } catch (error) {
        console.error('[Custom URL] Error opening settings:', error);
    }
}

function openHelp() {
    try {
        const windows = BrowserWindow.getAllWindows();
        let header = null;
        
        for (const window of windows) {
            if (window.webContents.getURL().includes('header')) {
                header = window;
                break;
            }
        }
        
        if (!header) {
            console.log('[Custom URL] Header window not found, creating new one');
            // Learning overlay system doesn't need header windows
            console.log('[Custom URL] Learning overlay system ready');
            
            // Wait a bit for the window to be created
            setTimeout(() => {
                const newWindows = BrowserWindow.getAllWindows();
                for (const window of newWindows) {
                    if (window.webContents.getURL().includes('header')) {
                        header = window;
                        break;
                    }
                }
    
    if (header) {
        header.focus();
        
                    const helpUrl = `http://localhost:${WEB_PORT}/help`;
                    console.log(`[Custom URL] Navigating to help page: ${helpUrl}`);
                    header.webContents.loadURL(helpUrl);
                }
            }, 1000);
        } else {
            header.focus();
            
            const helpUrl = `http://localhost:${WEB_PORT}/help`;
            console.log(`[Custom URL] Navigating to help page: ${helpUrl}`);
            header.webContents.loadURL(helpUrl);
        }
    } catch (error) {
        console.error('[Custom URL] Error opening help:', error);
    }
}

async function startWebStack() {
  const fs = require('fs');
  const os = require('os');
  const { spawn } = require('child_process');

  const getAvailablePort = (preferredPort = null) => {
    return new Promise((resolve, reject) => {
      const server = require('net').createServer();
      const port = preferredPort || 0;
      server.listen(port, (err) => {
        if (err) {
          if (preferredPort) {
            // If preferred port is taken, try a random port
      server.listen(0, (err) => {
        if (err) reject(err);
              const actualPort = server.address().port;
              server.close(() => resolve(actualPort));
            });
          } else {
            reject(err);
          }
        } else {
          const actualPort = server.address().port;
          server.close(() => resolve(actualPort));
        }
      });
    });
  };

  // Use a fixed port for the API to make communication easier
  const apiPort = 3001; // Force port 3001 for web app communication
  const frontendPort = await getAvailablePort();

  console.log(`🔧 Allocated ports: API=${apiPort}, Frontend=${frontendPort}`);

  process.env.pickleglass_API_PORT = apiPort.toString();
  process.env.pickleglass_API_URL = `http://localhost:${apiPort}`;
  process.env.pickleglass_WEB_PORT = frontendPort.toString();
  process.env.pickleglass_WEB_URL = `http://localhost:${frontendPort}`;

  // Create runtime config for the frontend
  const tempDir = os.tmpdir();
  const configPath = path.join(tempDir, 'pickleglass-runtime-config.json');

  const runtimeConfig = {
    API_URL: `http://localhost:${apiPort}`,
    WEB_URL: `http://localhost:${frontendPort}`,
    timestamp: Date.now()
  };
  
  fs.writeFileSync(configPath, JSON.stringify(runtimeConfig, null, 2));
  console.log(`📝 Runtime config created in temp location: ${configPath}`);

  const frontSrv = express();
  
  // 프론트엔드에서 /runtime-config.json을 요청하면 임시 폴더의 파일을 제공
  frontSrv.get('/runtime-config.json', (req, res) => {
    res.json(runtimeConfig);
  });

  const staticDir = app.isPackaged
    ? path.join(process.resourcesPath, 'pickleglass_web', 'out')
    : path.join(__dirname, '..', 'pickleglass_web', 'out');

  frontSrv.use((req, res, next) => {
    console.log(`[Frontend] ${req.method} ${req.url}`);
    next();
  });
  
  frontSrv.use(express.static(staticDir));
  
  const frontendServer = await new Promise((resolve, reject) => {
    const server = frontSrv.listen(frontendPort, '127.0.0.1', () => resolve(server));
    server.on('error', reject);
    app.once('before-quit', () => server.close());
  });

  console.log(`✅ Frontend server started on http://localhost:${frontendPort}`);

  const createBackendApp = require('../pickleglass_web/backend_node');
  const nodeApi = createBackendApp(eventBridge);

  const apiSrv = express();
  apiSrv.use(nodeApi);

  const apiServer = await new Promise((resolve, reject) => {
    const server = apiSrv.listen(apiPort, '127.0.0.1', (err) => {
      if (err) {
        if (err.code === 'EADDRINUSE') {
          console.error(`❌ Port ${apiPort} is already in use. Please close the process using this port and restart the Electron app.`);
          console.error(`💡 You can find what's using port ${apiPort} with: netstat -ano | findstr :${apiPort}`);
          reject(new Error(`Port ${apiPort} is already in use. Please close the conflicting process and restart.`));
        } else {
          reject(err);
        }
      } else {
        resolve(server);
      }
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${apiPort} is already in use. Please close the process using this port and restart the Electron app.`);
        console.error(`💡 You can find what's using port ${apiPort} with: netstat -ano | findstr :${apiPort}`);
        reject(new Error(`Port ${apiPort} is already in use. Please close the conflicting process and restart.`));
      } else {
        reject(err);
      }
    });
    app.once('before-quit', () => server.close());
  });

  console.log(`✅ API server started on http://localhost:${apiPort}`);

  console.log(`🚀 All services ready:
   Frontend: http://localhost:${frontendPort}
   API:      http://localhost:${apiPort}`);

  return frontendPort;
}

async function checkForUpdates() {
    if (app.isPackaged) {
        return;
    }

    try {
        await autoUpdater.checkForUpdates();
        autoUpdater.on('update-available', () => {
            console.log('Update available!');
            autoUpdater.downloadUpdate();
        });
        autoUpdater.on('update-downloaded', (event, releaseNotes, releaseName, date, url) => {
            console.log('Update downloaded:', releaseNotes, releaseName, date, url);
            dialog.showMessageBox({
                type: 'info',
                title: 'Application Update',
                message: `A new version of PickleGlass (${releaseName}) has been downloaded. It will be installed the next time you launch the application.`,
                buttons: ['Restart', 'Later']
            }).then(response => {
                if (response.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        });
        autoUpdater.on('error', (err) => {
            console.error('Error in auto-updater:', err);
        });
    } catch (err) {
        console.error('Error initializing auto-updater:', err);
    }
}