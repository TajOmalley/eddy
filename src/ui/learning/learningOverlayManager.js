const { BrowserWindow } = require('electron');
const path = require('path');
const projectService = require('../../features/project/projectService');
const guidanceService = require('../../features/guidance/guidanceService');
const contextService = require('../../features/context/contextService');
const askService = require('../../features/ask/askService');

class LearningOverlayManager {
    constructor() {
        this.overlayWindow = null;
        this.currentProject = null;
        this.currentStep = 0;
        this.isActive = false;
    }

    /**
     * Launch the learning overlay with project data
     */
    async launchOverlay(projectId, userId) {
        try {
            console.log(`[LearningOverlay] Launching overlay for project ${projectId}`);
            
            // Load project data
            const project = await projectService.loadProject(projectId);
            if (!project) {
                throw new Error(`Project ${projectId} not found`);
            }

            this.currentProject = project;
            this.currentStep = 0;
            this.isActive = true;

            // Create overlay window
            this.createOverlayWindow();

            // Start context analysis
            await contextService.startContextAnalysis();

            // Start guidance service
            await guidanceService.startGuidance();

            // Send project data to overlay
            this.sendProjectData();

            // Request initial guidance
            this.requestGuidance();

            console.log('[LearningOverlay] Overlay launched successfully');
            return { success: true, project };

        } catch (error) {
            console.error('[LearningOverlay] Error launching overlay:', error);
            throw error;
        }
    }

    /**
     * Create the overlay window
     */
    createOverlayWindow() {
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.focus();
            return;
        }

        // Get screen dimensions
        const { screen } = require('electron');
        const primaryDisplay = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

        this.overlayWindow = new BrowserWindow({
            width: Math.min(screenWidth * 0.9, 1200),
            height: 100,
            x: Math.round((screenWidth - Math.min(screenWidth * 0.9, 1200)) / 2),
            y: 20,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            frame: false,
            alwaysOnTop: true,
            resizable: true,
            minWidth: 400,
            minHeight: 60,
            maxHeight: 200,
            minimizable: false,
            maximizable: false,
            skipTaskbar: true,
            show: false,
            transparent: true,
            backgroundColor: '#00000000',
            hasShadow: false,
            thickFrame: false
        });

        // Load the overlay HTML
        this.overlayWindow.loadFile(path.join(__dirname, 'learning-overlay.html'));

        // Show window when ready
        this.overlayWindow.once('ready-to-show', () => {
            this.overlayWindow.show();
            this.overlayWindow.focus();
        });

        // Handle window closed
        this.overlayWindow.on('closed', () => {
            this.cleanup();
        });

        // Set up IPC handlers for this window
        this.setupIpcHandlers();
    }

    /**
     * Set up IPC handlers for the overlay window
     */
    setupIpcHandlers() {
        const { ipcMain } = require('electron');

        // Handle close overlay
        ipcMain.on('close-learning-overlay', () => {
            console.log('[LearningOverlay] Close requested');
            this.closeOverlay();
        });

        // Handle get project data
        ipcMain.on('get-project-data', () => {
            console.log('[LearningOverlay] Project data requested');
            this.sendProjectData();
        });

        // Handle guidance request
        ipcMain.on('request-guidance', async (event, data) => {
            console.log('[LearningOverlay] Guidance requested:', data);
            await this.handleGuidanceRequest(event, data);
        });
    }

    /**
     * Handle guidance request from overlay
     */
    async handleGuidanceRequest(event, data) {
        try {
            console.log('[LearningOverlay] Processing guidance request for step:', data.stepIndex);
            
            // Get current step
            const currentStep = this.currentProject?.steps?.[data.stepIndex];
            if (!currentStep) {
                throw new Error('No current step available');
            }

            // Get screen context
            const screenContext = await contextService.getCurrentScreenContext();
            console.log('[LearningOverlay] Screen context captured:', !!screenContext);

            // Generate contextual guidance
            const guidance = await this.generateContextualGuidance(currentStep, screenContext);
            console.log('[LearningOverlay] Guidance generated:', !!guidance);

            // Send guidance back to overlay
            if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
                this.overlayWindow.webContents.send('guidance-updated', guidance);
            }

        } catch (error) {
            console.error('[LearningOverlay] Error handling guidance request:', error);
            
            // Send error guidance to overlay
            const errorGuidance = {
                activity: 'Unknown',
                advice: 'Unable to analyze current activity. Please try again.',
                tips: 'Make sure you have a stable internet connection.'
            };
            
            if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
                this.overlayWindow.webContents.send('guidance-updated', errorGuidance);
            }
        }
    }

    /**
     * Send project data to the overlay
     */
    sendProjectData() {
        if (!this.overlayWindow || this.overlayWindow.isDestroyed()) return;

        const projectData = {
            id: this.currentProject.id,
            title: this.currentProject.document?.title || 'Learning Project',
            steps: this.currentProject.steps || [],
            currentStep: this.currentStep,
            progress: this.calculateProgress()
        };

        this.overlayWindow.webContents.send('project-data-loaded', projectData);
    }

    /**
     * Handle guidance request
     */
    async handleGuidanceRequest(data) {
        try {
            if (!this.currentProject || !this.currentProject.steps) return;

            const currentStep = this.currentProject.steps[data.stepIndex];
            if (!currentStep) return;

            // Get current screen context
            const screenContext = await contextService.getCurrentScreenContext();

            // Generate contextual guidance
            const guidance = await this.generateContextualGuidance(currentStep, screenContext);

            // Send guidance to overlay
            this.overlayWindow.webContents.send('guidance-updated', guidance);

        } catch (error) {
            console.error('[LearningOverlay] Error generating guidance:', error);
        }
    }

    /**
     * Generate contextual guidance using AI
     */
    async generateContextualGuidance(step, screenContext) {
        try {
            const prompt = this.buildGuidancePrompt(step, screenContext);
            
            // Use the ask service to get AI guidance
            const response = await askService.askAI(prompt, {
                context: 'learning_guidance',
                includeScreenContext: true
            });

            // Clean up the response
            const cleanResponse = response.trim();
            console.log('[LearningOverlay] AI guidance response:', cleanResponse);
            
            return {
                activity: this.extractActivity(screenContext),
                advice: cleanResponse || 'Analyzing your current activity...',
                tips: this.generateTips(step, screenContext)
            };

        } catch (error) {
            console.error('[LearningOverlay] Error generating guidance:', error);
            return {
                activity: 'Unknown',
                advice: 'Unable to analyze current activity. Please try again.',
                tips: 'Make sure you have a stable internet connection.'
            };
        }
    }

    /**
     * Build guidance prompt for AI
     */
    buildGuidancePrompt(step, screenContext) {
        const stepTitle = step.title || '';
        const stepContent = step.content || step.description || '';
        
        return `You are a learning assistant. Analyze the user's current screen and determine if they have completed this step:

CURRENT STEP: ${stepTitle}
STEP DETAILS: ${stepContent}

USER'S CURRENT SCREEN:
${screenContext?.screenshot ? '[Screenshot captured]' : '[No screenshot]'}

YOUR TASK:
1. Analyze if the user's screen shows they have completed this step
2. If YES: Respond with EXACTLY: "Great! Move to the next step."
3. If NO: Provide ONE clear, specific instruction (max 15 words) telling them exactly what to do next

RULES:
- Be direct and concise
- Give ONE specific action, not multiple
- Use imperative voice (e.g., "Click the...", "Open...", "Navigate to...")
- NO pleasantries or explanations
- If the step says "Open [URL]" and they haven't, say: "Open [URL] in your browser"

Response (ONE LINE ONLY):`;
    }

    /**
     * Extract current activity from screen context
     */
    extractActivity(screenContext) {
        if (!screenContext?.analysis) return 'Analyzing...';
        
        const app = screenContext.analysis.applicationContext?.name || 'Unknown app';
        const activity = screenContext.analysis.userActivity?.activity || 'Unknown activity';
        
        return `${activity} in ${app}`;
    }

    /**
     * Generate tips based on step and context
     */
    generateTips(step, screenContext) {
        const tips = [];
        
        // Check if step has content and it's a string
        const stepContent = step.content || step.description || step.title || '';
        
        if (stepContent.includes('code') || stepContent.includes('programming')) {
            tips.push('Make sure your code editor is open');
            tips.push('Check for any syntax errors');
        }
        
        if (stepContent.includes('design') || stepContent.includes('UI')) {
            tips.push('Keep your design tools open');
            tips.push('Reference the design requirements');
        }
        
        return tips.join(' • ');
    }

    /**
     * Calculate progress percentage
     */
    calculateProgress() {
        if (!this.currentProject || !this.currentProject.steps) return 0;
        return Math.round(((this.currentStep + 1) / this.currentProject.steps.length) * 100);
    }

    /**
     * Request guidance for current step
     */
    requestGuidance() {
        if (!this.currentProject || !this.currentProject.steps) return;

        const currentStep = this.currentProject.steps[this.currentStep];
        this.handleGuidanceRequest({
            step: currentStep,
            stepIndex: this.currentStep
        });
    }

    /**
     * Close the overlay
     */
    closeOverlay() {
        this.cleanup();
        
        if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
            this.overlayWindow.close();
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.isActive = false;
        this.currentProject = null;
        this.currentStep = 0;
        
        // Stop services
        contextService.stopContextAnalysis();
        guidanceService.stopGuidance();
    }
}

module.exports = new LearningOverlayManager();
