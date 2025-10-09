const { ipcMain } = require('electron');
const { projectService } = require('../features/project/projectService');
const { guidanceService } = require('../features/guidance/guidanceService');
const { contextService } = require('../features/context/contextService');

class ProjectContextBridge {
  constructor() {
    this.isInitialized = false;
    this.setupIpcHandlers();
  }

  /**
   * Initialize the bridge
   */
  initialize() {
    if (this.isInitialized) {
      console.log('[ProjectContextBridge] Already initialized');
      return;
    }

    this.isInitialized = true;
    console.log('[ProjectContextBridge] Initialized');
  }

  /**
   * Setup IPC handlers for project context communication
   */
  setupIpcHandlers() {
    // Project management handlers
    ipcMain.handle('project:load', async (event, projectId, projectDocument) => {
      try {
        const project = await projectService.loadProject(projectId, projectDocument);
        return { success: true, project };
      } catch (error) {
        console.error('[ProjectContextBridge] Error loading project:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('project:getCurrentStep', async (event) => {
      try {
        const currentStep = projectService.getCurrentStep();
        return { success: true, currentStep };
      } catch (error) {
        console.error('[ProjectContextBridge] Error getting current step:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('project:moveToNextStep', async (event) => {
      try {
        const nextStep = await projectService.moveToNextStep();
        return { success: true, nextStep };
      } catch (error) {
        console.error('[ProjectContextBridge] Error moving to next step:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('project:moveToStep', async (event, stepNumber) => {
      try {
        const step = await projectService.moveToStep(stepNumber);
        return { success: true, step };
      } catch (error) {
        console.error('[ProjectContextBridge] Error moving to step:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('project:getProgress', async (event) => {
      try {
        const progress = projectService.getProgress();
        const summary = projectService.getProjectSummary();
        return { success: true, progress, summary };
      } catch (error) {
        console.error('[ProjectContextBridge] Error getting progress:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('project:markStepCompleted', async (event, stepNumber) => {
      try {
        await projectService.markStepCompleted(stepNumber);
        return { success: true };
      } catch (error) {
        console.error('[ProjectContextBridge] Error marking step completed:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('project:reset', async (event) => {
      try {
        await projectService.resetProject();
        return { success: true };
      } catch (error) {
        console.error('[ProjectContextBridge] Error resetting project:', error);
        return { success: false, error: error.message };
      }
    });

    // Guidance service handlers
    ipcMain.handle('guidance:start', async (event) => {
      try {
        const result = await guidanceService.startGuidance();
        return { success: true, result };
      } catch (error) {
        console.error('[ProjectContextBridge] Error starting guidance:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('guidance:stop', async (event) => {
      try {
        const result = await guidanceService.stopGuidance();
        return { success: true, result };
      } catch (error) {
        console.error('[ProjectContextBridge] Error stopping guidance:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('guidance:getStatus', async (event) => {
      try {
        const status = guidanceService.getGuidanceStatus();
        return { success: true, status };
      } catch (error) {
        console.error('[ProjectContextBridge] Error getting guidance status:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('guidance:getHistory', async (event, limit) => {
      try {
        const history = guidanceService.getGuidanceHistory(limit);
        return { success: true, history };
      } catch (error) {
        console.error('[ProjectContextBridge] Error getting guidance history:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('guidance:clearHistory', async (event) => {
      try {
        guidanceService.clearGuidanceHistory();
        return { success: true };
      } catch (error) {
        console.error('[ProjectContextBridge] Error clearing guidance history:', error);
        return { success: false, error: error.message };
      }
    });

    // Context service handlers
    ipcMain.handle('context:startAnalysis', async (event) => {
      try {
        await contextService.startContextAnalysis();
        return { success: true };
      } catch (error) {
        console.error('[ProjectContextBridge] Error starting context analysis:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('context:stopAnalysis', async (event) => {
      try {
        await contextService.stopContextAnalysis();
        return { success: true };
      } catch (error) {
        console.error('[ProjectContextBridge] Error stopping context analysis:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('context:getCurrentContext', async (event) => {
      try {
        const context = contextService.getCurrentScreenContext();
        return { success: true, context };
      } catch (error) {
        console.error('[ProjectContextBridge] Error getting current context:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('context:getHistory', async (event, limit) => {
      try {
        const history = contextService.getContextHistory(limit);
        return { success: true, history };
      } catch (error) {
        console.error('[ProjectContextBridge] Error getting context history:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('context:matchToStep', async (event, projectStep) => {
      try {
        const screenContext = contextService.getCurrentScreenContext();
        const match = await contextService.matchContextToStep(projectStep, screenContext);
        return { success: true, match };
      } catch (error) {
        console.error('[ProjectContextBridge] Error matching context to step:', error);
        return { success: false, error: error.message };
      }
    });

    // Combined learning session handlers
    ipcMain.handle('learning:startSession', async (event, projectId, projectDocument) => {
      try {
        // Load project
        const project = await projectService.loadProject(projectId, projectDocument);
        
        // Start context analysis
        await contextService.startContextAnalysis();
        
        // Start guidance
        await guidanceService.startGuidance();
        
        return { success: true, project };
      } catch (error) {
        console.error('[ProjectContextBridge] Error starting learning session:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('learning:stopSession', async (event) => {
      try {
        // Stop guidance
        await guidanceService.stopGuidance();
        
        // Stop context analysis
        await contextService.stopContextAnalysis();
        
        // Reset project
        await projectService.resetProject();
        
        return { success: true };
      } catch (error) {
        console.error('[ProjectContextBridge] Error stopping learning session:', error);
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('learning:getSessionStatus', async (event) => {
      try {
        const projectStatus = projectService.getProjectSummary();
        const guidanceStatus = guidanceService.getGuidanceStatus();
        const contextStatus = contextService.getStatus();
        
        return {
          success: true,
          project: projectStatus,
          guidance: guidanceStatus,
          context: contextStatus
        };
      } catch (error) {
        console.error('[ProjectContextBridge] Error getting session status:', error);
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Get session status
   */
  async getSessionStatus() {
    try {
      const projectStatus = projectService ? projectService.getProjectSummary() : null;
      const guidanceStatus = guidanceService ? guidanceService.getGuidanceStatus() : null;
      const contextStatus = contextService ? contextService.getStatus() : null;
      
      return {
        success: true,
        project: projectStatus,
        guidance: guidanceStatus,
        context: contextStatus
      };
    } catch (error) {
      console.error('[ProjectContextBridge] Error getting session status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send guidance update to renderer
   */
  sendGuidanceUpdate(guidance) {
    try {
      // This would send to the main window or overlay
      console.log('[ProjectContextBridge] Sending guidance update:', guidance.text.substring(0, 100) + '...');
    } catch (error) {
      console.error('[ProjectContextBridge] Error sending guidance update:', error);
    }
  }

  /**
   * Send progress update to renderer
   */
  sendProgressUpdate(progress) {
    try {
      // This would send progress updates to the renderer
      console.log('[ProjectContextBridge] Sending progress update:', progress);
    } catch (error) {
      console.error('[ProjectContextBridge] Error sending progress update:', error);
    }
  }
}

module.exports = new ProjectContextBridge();
