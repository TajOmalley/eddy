const { listenService } = require('../listen/listenService');

class ContextService {
  constructor() {
    this.screenAnalysis = null;
    this.contextHistory = [];
    this.analysisInterval = null;
    this.isAnalyzing = false;
  }

  /**
   * Start continuous screen context analysis
   */
  async startContextAnalysis() {
    try {
      if (this.isAnalyzing) {
        console.log('[ContextService] Context analysis already running');
        return;
      }

      this.isAnalyzing = true;
      console.log('[ContextService] Starting screen context analysis');
      
      // For testing, don't start automatic analysis to avoid errors
      console.log('[ContextService] Automatic analysis disabled for testing');
      // this.analysisInterval = setInterval(async () => {
      //   await this.analyzeCurrentScreen();
      // }, 3000); // Analyze every 3 seconds
      
    } catch (error) {
      console.error('[ContextService] Error starting context analysis:', error);
      throw error;
    }
  }

  /**
   * Stop screen context analysis
   */
  async stopContextAnalysis() {
    try {
      this.isAnalyzing = false;
      
      if (this.analysisInterval) {
        clearInterval(this.analysisInterval);
        this.analysisInterval = null;
      }
      
      console.log('[ContextService] Stopped screen context analysis');
    } catch (error) {
      console.error('[ContextService] Error stopping context analysis:', error);
      throw error;
    }
  }

  /**
   * Analyze current screen content
   */
  async analyzeCurrentScreen() {
    try {
      if (!this.isAnalyzing) return;

      // Get screen capture data
      const screenData = await this.captureScreenData();
      
      // Analyze screen content
      const analysis = await this.analyzeScreenContent(screenData);
      
      // Store context
      this.screenAnalysis = {
        timestamp: new Date(),
        analysis: analysis,
        screenData: screenData
      };
      
      // Add to history
      this.contextHistory.push(this.screenAnalysis);
      
      // Limit history size
      if (this.contextHistory.length > 20) {
        this.contextHistory = this.contextHistory.slice(-20);
      }
      
    } catch (error) {
      console.error('[ContextService] Error analyzing screen:', error);
    }
  }

  /**
   * Capture screen data using existing listen service
   */
  async captureScreenData() {
    try {
      console.log('[ContextService] 📸 Capturing screen data...');
      
      // Try to use the askService screenshot functionality
      const { captureScreenshot } = require('../ask/askService');
      
      if (typeof captureScreenshot === 'function') {
        console.log('[ContextService] Using askService screenshot capture');
        const screenshotResult = await captureScreenshot({ quality: 'medium' });
        
        if (screenshotResult.success) {
          console.log(`[ContextService] ✅ Screenshot captured successfully: ${screenshotResult.width}x${screenshotResult.height}`);
          return {
            image: screenshotResult.base64,
            timestamp: new Date(),
            metadata: {
              resolution: { 
                width: screenshotResult.width || 1920, 
                height: screenshotResult.height || 1080 
              },
              format: 'base64'
            }
          };
        } else {
          console.error('[ContextService] ❌ Screenshot capture failed:', screenshotResult.error);
        }
      } else {
        console.warn('[ContextService] captureScreenshot function not available');
      }
      
      // Fallback: Check if listenService has captureScreen method
      if (listenService && typeof listenService.captureScreen === 'function') {
        console.log('[ContextService] Using listenService screen capture');
        const screenCapture = await listenService.captureScreen();
        
        return {
          image: screenCapture.image,
          timestamp: new Date(),
          metadata: {
            resolution: screenCapture.resolution,
            format: screenCapture.format
          }
        };
      }

      // Final fallback: mock data
      console.warn('[ContextService] ⚠️ Screen capture not available, using mock data');
      return {
        image: null,
        timestamp: new Date(),
        metadata: {
          resolution: { width: 1920, height: 1080 },
          format: 'mock'
        }
      };
      
    } catch (error) {
      console.error('[ContextService] ❌ Error capturing screen data:', error);
      return null;
    }
  }

  /**
   * Analyze screen content for learning context
   */
  async analyzeScreenContent(screenData) {
    try {
      if (!screenData) return null;

      // Basic screen analysis
      const analysis = {
        detectedElements: [],
        textContent: [],
        uiElements: [],
        applicationContext: null,
        userActivity: null
      };

      // Detect UI elements (this would be enhanced with actual computer vision)
      analysis.detectedElements = await this.detectUIElements(screenData);
      
      // Extract text content
      analysis.textContent = await this.extractTextContent(screenData);
      
      // Determine application context
      analysis.applicationContext = await this.determineApplicationContext(analysis);
      
      // Analyze user activity
      analysis.userActivity = await this.analyzeUserActivity(analysis);
      
      return analysis;
      
    } catch (error) {
      console.error('[ContextService] Error analyzing screen content:', error);
      return null;
    }
  }

  /**
   * Detect UI elements on screen
   */
  async detectUIElements(screenData) {
    try {
      // This would integrate with computer vision or OCR
      // For now, return mock data
      return [
        { type: 'button', text: 'New File', position: { x: 100, y: 50 } },
        { type: 'input', text: '', position: { x: 200, y: 100 } },
        { type: 'menu', text: 'File', position: { x: 50, y: 30 } }
      ];
    } catch (error) {
      console.error('[ContextService] Error detecting UI elements:', error);
      return [];
    }
  }

  /**
   * Extract text content from screen
   */
  async extractTextContent(screenData) {
    try {
      // This would integrate with OCR
      // For now, return mock data
      return [
        { text: 'Welcome to Code Editor', position: { x: 100, y: 20 } },
        { text: 'File Edit View', position: { x: 50, y: 30 } },
        { text: 'console.log("Hello World")', position: { x: 200, y: 150 } }
      ];
    } catch (error) {
      console.error('[ContextService] Error extracting text content:', error);
      return [];
    }
  }

  /**
   * Determine application context
   */
  async determineApplicationContext(analysis) {
    try {
      const { detectedElements, textContent } = analysis;
      
      // Analyze to determine what application user is using
      if (textContent.some(text => text.text.includes('console.log'))) {
        return { type: 'code_editor', name: 'Code Editor' };
      }
      
      if (detectedElements.some(el => el.type === 'button' && el.text.includes('New File'))) {
        return { type: 'code_editor', name: 'Online Code Editor' };
      }
      
      return { type: 'unknown', name: 'Unknown Application' };
      
    } catch (error) {
      console.error('[ContextService] Error determining application context:', error);
      return null;
    }
  }

  /**
   * Analyze user activity
   */
  async analyzeUserActivity(analysis) {
    try {
      const { detectedElements, textContent } = analysis;
      
      // Determine what user is likely doing
      if (textContent.some(text => text.text.includes('function') || text.text.includes('const'))) {
        return { activity: 'coding', confidence: 0.8 };
      }
      
      if (detectedElements.some(el => el.type === 'button' && el.text.includes('Run'))) {
        return { activity: 'testing_code', confidence: 0.7 };
      }
      
      return { activity: 'browsing', confidence: 0.5 };
      
    } catch (error) {
      console.error('[ContextService] Error analyzing user activity:', error);
      return null;
    }
  }

  /**
   * Get current screen context
   */
  async getCurrentScreenContext() {
    try {
      // If we don't have recent analysis, capture screen data now
      if (!this.screenAnalysis || 
          (Date.now() - this.screenAnalysis.timestamp.getTime()) > 5000) {
        console.log('[ContextService] Capturing fresh screen context');
        await this.analyzeCurrentScreen();
      }
      
      return this.screenAnalysis;
    } catch (error) {
      console.error('[ContextService] Error getting screen context:', error);
      return null;
    }
  }

  /**
   * Get context history
   */
  getContextHistory(limit = 10) {
    return this.contextHistory.slice(-limit);
  }

  /**
   * Match screen context to project step
   */
  async matchContextToStep(projectStep, screenContext) {
    try {
      if (!projectStep || !screenContext) return null;

      const { analysis } = screenContext;
      const { expectedElements, verificationCriteria } = projectStep;
      
      // Check if expected elements are present
      const elementMatches = expectedElements.map(expected => {
        return analysis.detectedElements.some(element => 
          element.text.toLowerCase().includes(expected.toLowerCase())
        );
      });
      
      // Check verification criteria
      const criteriaMatch = this.checkVerificationCriteria(verificationCriteria, analysis);
      
      return {
        stepNumber: projectStep.stepNumber,
        elementMatches: elementMatches,
        criteriaMatch: criteriaMatch,
        overallMatch: elementMatches.every(match => match) && criteriaMatch,
        confidence: this.calculateMatchConfidence(elementMatches, criteriaMatch)
      };
      
    } catch (error) {
      console.error('[ContextService] Error matching context to step:', error);
      return null;
    }
  }

  /**
   * Check verification criteria
   */
  checkVerificationCriteria(criteria, analysis) {
    try {
      if (!criteria) return true;
      
      const { textContent } = analysis;
      const criteriaText = criteria.toLowerCase();
      
      // Check if any text content matches the criteria
      return textContent.some(text => 
        text.text.toLowerCase().includes(criteriaText)
      );
      
    } catch (error) {
      console.error('[ContextService] Error checking verification criteria:', error);
      return false;
    }
  }

  /**
   * Calculate match confidence
   */
  calculateMatchConfidence(elementMatches, criteriaMatch) {
    try {
      const elementScore = elementMatches.filter(match => match).length / elementMatches.length;
      const criteriaScore = criteriaMatch ? 1 : 0;
      
      return (elementScore + criteriaScore) / 2;
      
    } catch (error) {
      console.error('[ContextService] Error calculating match confidence:', error);
      return 0;
    }
  }

  /**
   * Get context service status
   */
  getStatus() {
    return {
      isAnalyzing: this.isAnalyzing,
      hasScreenAnalysis: !!this.screenAnalysis,
      contextHistoryLength: this.contextHistory.length,
      lastAnalysis: this.screenAnalysis?.timestamp
    };
  }
}

module.exports = new ContextService();
