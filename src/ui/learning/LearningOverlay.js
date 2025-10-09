const { BrowserWindow } = require('electron');
const path = require('path');

class LearningOverlay {
  constructor() {
    this.overlayWindow = null;
    this.isVisible = false;
    this.currentGuidance = null;
    this.position = { x: 100, y: 100 };
    this.size = { width: 400, height: 300 };
  }

  /**
   * Create the learning overlay window
   */
  createOverlay() {
    try {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        console.log('[LearningOverlay] Overlay already exists');
        return;
      }

      this.overlayWindow = new BrowserWindow({
        width: this.size.width,
        height: this.size.height,
        x: this.position.x,
        y: this.position.y,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        resizable: true,
        minimizable: false,
        maximizable: false,
        skipTaskbar: true,
        webPreferences: {
          nodeIntegration: true,
          contextIsolation: false,
          enableRemoteModule: true
        }
      });

      // Load the overlay HTML
      this.overlayWindow.loadFile(path.join(__dirname, 'learning-overlay.html'));

      // Handle window events
      this.overlayWindow.on('closed', () => {
        this.overlayWindow = null;
        this.isVisible = false;
      });

      // Make window draggable
      this.makeWindowDraggable();

      console.log('[LearningOverlay] Overlay window created');
    } catch (error) {
      console.error('[LearningOverlay] Error creating overlay:', error);
      throw error;
    }
  }

  /**
   * Show the learning overlay
   */
  show() {
    try {
      if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
        this.createOverlay();
      }

      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.show();
        this.overlayWindow.focus();
        this.isVisible = true;
        console.log('[LearningOverlay] Overlay shown');
      }
    } catch (error) {
      console.error('[LearningOverlay] Error showing overlay:', error);
    }
  }

  /**
   * Hide the learning overlay
   */
  hide() {
    try {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.hide();
        this.isVisible = false;
        console.log('[LearningOverlay] Overlay hidden');
      }
    } catch (error) {
      console.error('[LearningOverlay] Error hiding overlay:', error);
    }
  }

  /**
   * Update guidance content
   */
  updateGuidance(guidance) {
    try {
      if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
        return;
      }

      this.currentGuidance = guidance;
      
      // Send guidance update to renderer
      this.overlayWindow.webContents.send('update-guidance', {
        text: guidance.text,
        type: guidance.type,
        timestamp: guidance.timestamp,
        priority: guidance.priority
      });

      console.log('[LearningOverlay] Guidance updated');
    } catch (error) {
      console.error('[LearningOverlay] Error updating guidance:', error);
    }
  }

  /**
   * Update project progress
   */
  updateProgress(progress) {
    try {
      if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
        return;
      }

      // Send progress update to renderer
      this.overlayWindow.webContents.send('update-progress', {
        currentStep: progress.currentStep,
        totalSteps: progress.totalSteps,
        progress: progress.progress,
        completedSteps: progress.completedSteps
      });

      console.log('[LearningOverlay] Progress updated');
    } catch (error) {
      console.error('[LearningOverlay] Error updating progress:', error);
    }
  }

  /**
   * Update current step information
   */
  updateCurrentStep(step) {
    try {
      if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
        return;
      }

      // Send step update to renderer
      this.overlayWindow.webContents.send('update-step', {
        stepNumber: step.stepNumber,
        title: step.title,
        description: step.description,
        expectedElements: step.expectedElements,
        verificationCriteria: step.verificationCriteria
      });

      console.log('[LearningOverlay] Current step updated');
    } catch (error) {
      console.error('[LearningOverlay] Error updating current step:', error);
    }
  }

  /**
   * Make the window draggable
   */
  makeWindowDraggable() {
    try {
      if (!this.overlayWindow || this.overlayWindow.isDestroyed()) {
        return;
      }

      // Add drag functionality
      this.overlayWindow.webContents.executeJavaScript(`
        const { ipcRenderer } = require('electron');
        
        // Make the overlay draggable
        document.addEventListener('DOMContentLoaded', () => {
          const overlay = document.getElementById('learning-overlay');
          if (overlay) {
            overlay.style.webkitAppRegion = 'drag';
          }
        });
      `);
    } catch (error) {
      console.error('[LearningOverlay] Error making window draggable:', error);
    }
  }

  /**
   * Update overlay position
   */
  updatePosition(x, y) {
    try {
      this.position = { x, y };
      
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.setPosition(x, y);
      }
    } catch (error) {
      console.error('[LearningOverlay] Error updating position:', error);
    }
  }

  /**
   * Update overlay size
   */
  updateSize(width, height) {
    try {
      this.size = { width, height };
      
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.setSize(width, height);
      }
    } catch (error) {
      console.error('[LearningOverlay] Error updating size:', error);
    }
  }

  /**
   * Get overlay status
   */
  getStatus() {
    return {
      isVisible: this.isVisible,
      hasWindow: !!(this.overlayWindow && !this.overlayWindow.isDestroyed()),
      position: this.position,
      size: this.size,
      currentGuidance: this.currentGuidance
    };
  }

  /**
   * Close the overlay
   */
  close() {
    try {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.close();
        this.overlayWindow = null;
        this.isVisible = false;
        console.log('[LearningOverlay] Overlay closed');
      }
    } catch (error) {
      console.error('[LearningOverlay] Error closing overlay:', error);
    }
  }
}

module.exports = new LearningOverlay();
