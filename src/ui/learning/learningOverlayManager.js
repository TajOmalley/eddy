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

        this.overlayWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,
                enableRemoteModule: true
            },
            frame: false,
            alwaysOnTop: true,
            resizable: true,
            minimizable: false,
            maximizable: false,
            skipTaskbar: true,
            show: false,
            transparent: false,
            backgroundColor: '#000000'
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
        ipcMain.on('request-guidance', (event, data) => {
            console.log('[LearningOverlay] Guidance requested:', data);
            this.handleGuidanceRequest(data);
        });
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

            return {
                activity: this.extractActivity(screenContext),
                advice: response || 'Analyzing your current activity...',
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
        return `You are a learning assistant helping a user with this step:

STEP: ${step.title}
CONTENT: ${step.content}

CURRENT SCREEN CONTEXT:
- Application: ${screenContext?.analysis?.applicationContext?.name || 'Unknown'}
- Activity: ${screenContext?.analysis?.userActivity?.activity || 'Unknown'}
- Elements: ${JSON.stringify(screenContext?.analysis?.detectedElements || [], null, 2)}

Provide specific, actionable guidance for this learning step. Be encouraging and helpful. Focus on what the user should do next based on their current screen context.`;
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
        
        if (step.content.includes('code') || step.content.includes('programming')) {
            tips.push('Make sure your code editor is open');
            tips.push('Check for any syntax errors');
        }
        
        if (step.content.includes('design') || step.content.includes('UI')) {
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
