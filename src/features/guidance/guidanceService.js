const { askService } = require('../ask/askService');
const { projectService } = require('../project/projectService');
const { contextService } = require('../context/contextService');

class GuidanceService {
  constructor() {
    this.isActive = false;
    this.guidanceOverlay = null;
    this.currentGuidance = null;
    this.guidanceHistory = [];
  }

  /**
   * Start real-time guidance for active project
   */
  async startGuidance() {
    try {
      if (!projectService || !projectService.activeProject) {
        console.warn('[GuidanceService] No active project found, starting guidance anyway for testing');
        // Continue for testing purposes
      }

      this.isActive = true;
      console.log('[GuidanceService] Starting real-time guidance');
      
      // Initialize guidance overlay
      await this.initializeGuidanceOverlay();
      
      // Start continuous guidance monitoring
      this.startGuidanceMonitoring();
      
      return true;
    } catch (error) {
      console.error('[GuidanceService] Error starting guidance:', error);
      throw error;
    }
  }

  /**
   * Stop real-time guidance
   */
  async stopGuidance() {
    try {
      this.isActive = false;
      
      if (this.guidanceOverlay) {
        await this.hideGuidanceOverlay();
      }
      
      console.log('[GuidanceService] Stopped real-time guidance');
      return true;
    } catch (error) {
      console.error('[GuidanceService] Error stopping guidance:', error);
      throw error;
    }
  }

  /**
   * Initialize guidance overlay
   */
  async initializeGuidanceOverlay() {
    try {
      // Create guidance overlay window
      this.guidanceOverlay = {
        isVisible: false,
        currentStep: null,
        guidanceText: '',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 300 }
      };
      
      console.log('[GuidanceService] Guidance overlay initialized');
    } catch (error) {
      console.error('[GuidanceService] Error initializing overlay:', error);
      throw error;
    }
  }

  /**
   * Start continuous guidance monitoring
   */
  startGuidanceMonitoring() {
    if (!this.isActive) return;

    // Monitor screen context and provide guidance
    setInterval(async () => {
      if (this.isActive) {
        await this.analyzeAndProvideGuidance();
      }
    }, 2000); // Check every 2 seconds
  }

  /**
   * Analyze current context and provide guidance
   */
  async analyzeAndProvideGuidance() {
    try {
      // Get current project step
      const currentStep = projectService && projectService.getCurrentStep ? projectService.getCurrentStep() : null;
      if (!currentStep) return;

      // Get screen context
      const screenContext = await contextService.getCurrentScreenContext();
      
      // Generate contextual guidance
      const guidance = await this.generateContextualGuidance(currentStep, screenContext);
      
      if (guidance && guidance !== this.currentGuidance) {
        await this.showGuidance(guidance);
        this.currentGuidance = guidance;
      }
      
    } catch (error) {
      console.error('[GuidanceService] Error analyzing context:', error);
    }
  }

  /**
   * Generate contextual guidance based on current step and screen
   */
  async generateContextualGuidance(currentStep, screenContext) {
    try {
      // Build context for AI
      const context = {
        currentStep: currentStep,
        screenContext: screenContext,
        projectProgress: projectService && projectService.getProgress ? projectService.getProgress() : 0,
        userHistory: this.guidanceHistory.slice(-5) // Last 5 guidance interactions
      };

      // Create guidance prompt
      const prompt = this.buildGuidancePrompt(context);
      
      // Get AI guidance
      const aiResponse = await askService.askAI(prompt, {
        context: 'learning_guidance',
        maxTokens: 200,
        temperature: 0.7
      });

      return this.parseGuidanceResponse(aiResponse);
      
    } catch (error) {
      console.error('[GuidanceService] Error generating guidance:', error);
      return null;
    }
  }

  /**
   * Build guidance prompt for AI
   */
  buildGuidancePrompt(context) {
    const { currentStep, screenContext, projectProgress } = context;
    
    return `You are a helpful learning assistant guiding a user through a hands-on project.

CURRENT PROJECT STEP:
Step ${currentStep.stepNumber}: ${currentStep.title}
Description: ${currentStep.description}
Expected Elements: ${currentStep.expectedElements.join(', ')}
Verification: ${currentStep.verificationCriteria}

CURRENT SCREEN CONTEXT:
${JSON.stringify(screenContext, null, 2)}

PROJECT PROGRESS: ${projectProgress}%

Provide specific, actionable guidance for what the user should do next. Keep it concise and helpful. If the user seems stuck, provide troubleshooting tips.`;
  }

  /**
   * Parse AI guidance response
   */
  parseGuidanceResponse(aiResponse) {
    try {
      return {
        text: aiResponse,
        timestamp: new Date(),
        type: 'guidance',
        priority: 'normal'
      };
    } catch (error) {
      console.error('[GuidanceService] Error parsing guidance response:', error);
      return null;
    }
  }

  /**
   * Show guidance to user
   */
  async showGuidance(guidance) {
    try {
      if (!this.guidanceOverlay) return;

      // Update overlay content
      this.guidanceOverlay.guidanceText = guidance.text;
      this.guidanceOverlay.isVisible = true;
      
      // Add to guidance history
      this.guidanceHistory.push(guidance);
      
      // Limit history size
      if (this.guidanceHistory.length > 50) {
        this.guidanceHistory = this.guidanceHistory.slice(-50);
      }
      
      console.log('[GuidanceService] Showing guidance:', guidance.text.substring(0, 100) + '...');
      
    } catch (error) {
      console.error('[GuidanceService] Error showing guidance:', error);
    }
  }

  /**
   * Hide guidance overlay
   */
  async hideGuidanceOverlay() {
    try {
      if (this.guidanceOverlay) {
        this.guidanceOverlay.isVisible = false;
        this.guidanceOverlay.guidanceText = '';
      }
    } catch (error) {
      console.error('[GuidanceService] Error hiding overlay:', error);
    }
  }

  /**
   * Get current guidance status
   */
  getGuidanceStatus() {
    return {
      isActive: this.isActive,
      currentGuidance: this.currentGuidance,
      overlayVisible: this.guidanceOverlay?.isVisible || false,
      guidanceCount: this.guidanceHistory.length
    };
  }

  /**
   * Get guidance history
   */
  getGuidanceHistory(limit = 10) {
    return this.guidanceHistory.slice(-limit);
  }

  /**
   * Clear guidance history
   */
  clearGuidanceHistory() {
    this.guidanceHistory = [];
    console.log('[GuidanceService] Guidance history cleared');
  }

  /**
   * Update guidance overlay position
   */
  updateOverlayPosition(x, y) {
    if (this.guidanceOverlay) {
      this.guidanceOverlay.position = { x, y };
    }
  }

  /**
   * Update guidance overlay size
   */
  updateOverlaySize(width, height) {
    if (this.guidanceOverlay) {
      this.guidanceOverlay.size = { width, height };
    }
  }
}

module.exports = new GuidanceService();
