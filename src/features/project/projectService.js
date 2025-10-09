const { getFirestoreInstance } = require('../common/services/firebaseClient');
const { sessionRepository } = require('../common/repositories/session');

class ProjectService {
  constructor() {
    this.activeProject = null;
    this.currentStep = 0;
    this.userProgress = {};
    this.projectSteps = [];
  }

  /**
   * Load a project document and initialize learning session
   */
  async loadProject(projectId, projectDocument = null) {
    try {
      let projectData = projectDocument;
      
      // If no project document provided, fetch from Firebase
      if (!projectData) {
        console.log(`[ProjectService] Fetching project ${projectId} from Firebase...`);
        projectData = await this.fetchProjectFromFirebase(projectId);
      }

      this.activeProject = {
        id: projectId,
        document: projectData,
        steps: this.parseProjectSteps(projectData),
        startTime: new Date(),
        progress: 0
      };

      this.projectSteps = this.activeProject.steps;
      this.currentStep = 0;

      // Initialize user progress tracking
      await this.initializeProgressTracking(projectId);

      console.log(`[ProjectService] Loaded project: ${projectId} with ${this.projectSteps.length} steps`);
      return this.activeProject;
    } catch (error) {
      console.error('[ProjectService] Error loading project:', error);
      throw error;
    }
  }

  /**
   * Fetch project from Firebase
   */
  async fetchProjectFromFirebase(projectId) {
    try {
      const db = getFirestoreInstance();
      const { doc, getDoc } = require('firebase/firestore');
      
      console.log(`[ProjectService] Fetching project ${projectId} from Firebase...`);
      const projectRef = doc(db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        const projectData = projectSnap.data();
        console.log(`[ProjectService] Fetched project from Firebase:`, {
          id: projectId,
          title: projectData.title,
          topic: projectData.topic,
          contentLength: projectData.content?.length || 0,
          stepsCount: projectData.steps?.length || 0
        });
        return projectData;
      } else {
        console.error(`[ProjectService] Project ${projectId} not found in Firebase`);
        throw new Error(`Project ${projectId} not found in Firebase`);
      }
    } catch (error) {
      console.error('[ProjectService] Error fetching project from Firebase:', error);
      throw error;
    }
  }

  /**
   * Parse project document into structured steps
   */
  parseProjectSteps(projectData) {
    // Handle different project data structures
    let content = '';
    
    if (typeof projectData === 'string') {
      // If it's a string, use it directly
      content = projectData;
    } else if (projectData && projectData.content) {
      // If it's an object with content property (Firebase structure)
      content = projectData.content;
    } else if (projectData && projectData.document) {
      // If it's an object with document property
      content = projectData.document;
    } else {
      console.warn('[ProjectService] Unknown project data structure:', projectData);
      return [];
    }

    const steps = [];
    const lines = content.split('\n');
    let currentStep = null;
    let stepNumber = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect step headers (numbered steps)
      if (line.match(/^\d+\./)) {
        if (currentStep) {
          steps.push(currentStep);
        }
        
        stepNumber = parseInt(line.match(/^(\d+)\./)[1]);
        currentStep = {
          stepNumber,
          title: line.replace(/^\d+\.\s*/, ''),
          description: '',
          expectedElements: [],
          guidanceText: '',
          verificationCriteria: '',
          nextStepTrigger: '',
          subSteps: []
        };
      }
      // Detect sub-steps
      else if (line.startsWith('-') && currentStep) {
        currentStep.subSteps.push(line.replace(/^-\s*/, ''));
      }
      // Detect expected results
      else if (line.toLowerCase().includes('expected result:') && currentStep) {
        currentStep.verificationCriteria = line.replace(/expected result:/i, '').trim();
      }
      // Detect guidance text
      else if (line.toLowerCase().includes('guidance:') && currentStep) {
        currentStep.guidanceText = line.replace(/guidance:/i, '').trim();
      }
      // Regular description text
      else if (currentStep && line.length > 0) {
        if (currentStep.description) {
          currentStep.description += ' ' + line;
        } else {
          currentStep.description = line;
        }
      }
    }

    // Add the last step
    if (currentStep) {
      steps.push(currentStep);
    }

    console.log(`[ProjectService] Parsed ${steps.length} steps from project content`);
    return steps;
  }

  /**
   * Get current step information
   */
  getCurrentStep() {
    if (!this.activeProject || this.currentStep >= this.projectSteps.length) {
      return null;
    }
    return this.projectSteps[this.currentStep];
  }

  /**
   * Get next step information
   */
  getNextStep() {
    if (!this.activeProject || this.currentStep + 1 >= this.projectSteps.length) {
      return null;
    }
    return this.projectSteps[this.currentStep + 1];
  }

  /**
   * Get all remaining steps
   */
  getRemainingSteps() {
    if (!this.activeProject) return [];
    return this.projectSteps.slice(this.currentStep);
  }

  /**
   * Get project progress percentage
   */
  getProgress() {
    if (!this.activeProject || this.projectSteps.length === 0) return 0;
    return Math.round((this.currentStep / this.projectSteps.length) * 100);
  }

  /**
   * Move to next step
   */
  async moveToNextStep() {
    if (this.currentStep < this.projectSteps.length - 1) {
      this.currentStep++;
      await this.updateProgress();
      console.log(`[ProjectService] Moved to step ${this.currentStep + 1}`);
      return this.getCurrentStep();
    }
    return null;
  }

  /**
   * Move to specific step
   */
  async moveToStep(stepNumber) {
    if (stepNumber >= 0 && stepNumber < this.projectSteps.length) {
      this.currentStep = stepNumber;
      await this.updateProgress();
      console.log(`[ProjectService] Moved to step ${stepNumber + 1}`);
      return this.getCurrentStep();
    }
    return null;
  }

  /**
   * Initialize progress tracking
   */
  async initializeProgressTracking(projectId) {
    try {
      this.userProgress = {
        projectId,
        currentStep: 0,
        completedSteps: [],
        startTime: new Date(),
        lastActivity: new Date()
      };

      // Save to session (if repository is available)
      if (sessionRepository && sessionRepository.create) {
        await sessionRepository.create({
          type: 'learning_session',
          projectId,
          progress: this.userProgress
        });
      } else {
        console.warn('[ProjectService] Session repository not available, using in-memory progress tracking');
      }
    } catch (error) {
      console.error('[ProjectService] Error initializing progress tracking:', error);
    }
  }

  /**
   * Update user progress
   */
  async updateProgress() {
    try {
      this.userProgress.currentStep = this.currentStep;
      this.userProgress.lastActivity = new Date();
      this.userProgress.progress = this.getProgress();

      // Update session (if repository is available)
      if (sessionRepository && sessionRepository.update) {
        await sessionRepository.update(this.userProgress.projectId, {
          progress: this.userProgress
        });
      }
    } catch (error) {
      console.error('[ProjectService] Error updating progress:', error);
    }
  }

  /**
   * Mark step as completed
   */
  async markStepCompleted(stepNumber) {
    try {
      if (!this.userProgress.completedSteps.includes(stepNumber)) {
        this.userProgress.completedSteps.push(stepNumber);
        await this.updateProgress();
        console.log(`[ProjectService] Marked step ${stepNumber + 1} as completed`);
      }
    } catch (error) {
      console.error('[ProjectService] Error marking step completed:', error);
    }
  }

  /**
   * Get project summary
   */
  getProjectSummary() {
    if (!this.activeProject) return null;

    return {
      id: this.activeProject.id,
      totalSteps: this.projectSteps.length,
      currentStep: this.currentStep + 1,
      progress: this.getProgress(),
      completedSteps: this.userProgress.completedSteps.length,
      remainingSteps: this.projectSteps.length - this.currentStep
    };
  }

  /**
   * Reset project
   */
  async resetProject() {
    this.activeProject = null;
    this.currentStep = 0;
    this.userProgress = {};
    this.projectSteps = [];
    console.log('[ProjectService] Project reset');
  }
}

module.exports = new ProjectService();
