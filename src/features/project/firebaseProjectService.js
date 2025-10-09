const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, limit } = require('firebase/firestore');
const firebaseConfig = require('../../firebase-config');

class FirebaseProjectService {
  constructor() {
    this.app = null;
    this.db = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.db = getFirestore(this.app);
      this.initialized = true;
      
      console.log('[FirebaseProjectService] Firebase initialized successfully');
    } catch (error) {
      console.error('[FirebaseProjectService] Firebase initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create a new project document
   */
  async createProject(projectData) {
    await this.initialize();
    
    try {
      const projectRef = doc(collection(this.db, 'projects'));
      const project = {
        id: projectRef.id,
        ...projectData,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1
      };
      
      await setDoc(projectRef, project);
      console.log('[FirebaseProjectService] Project created:', project.id);
      
      return project;
    } catch (error) {
      console.error('[FirebaseProjectService] Error creating project:', error);
      throw error;
    }
  }

  /**
   * Get a project by ID
   */
  async getProject(projectId) {
    await this.initialize();
    
    try {
      const projectRef = doc(this.db, 'projects', projectId);
      const projectSnap = await getDoc(projectRef);
      
      if (projectSnap.exists()) {
        return projectSnap.data();
      } else {
        throw new Error('Project not found');
      }
    } catch (error) {
      console.error('[FirebaseProjectService] Error getting project:', error);
      throw error;
    }
  }

  /**
   * Get all projects for a user
   */
  async getUserProjects(userId) {
    await this.initialize();
    
    try {
      const projectsRef = collection(this.db, 'projects');
      const q = query(
        projectsRef,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const projects = [];
      
      querySnapshot.forEach((doc) => {
        projects.push(doc.data());
      });
      
      return projects;
    } catch (error) {
      console.error('[FirebaseProjectService] Error getting user projects:', error);
      throw error;
    }
  }

  /**
   * Search projects by topic or difficulty
   */
  async searchProjects(filters = {}) {
    await this.initialize();
    
    try {
      const projectsRef = collection(this.db, 'projects');
      let q = query(projectsRef);
      
      // Add filters
      if (filters.topic) {
        q = query(q, where('topic', '==', filters.topic));
      }
      if (filters.difficulty) {
        q = query(q, where('difficulty', '==', filters.difficulty));
      }
      if (filters.limit) {
        q = query(q, limit(filters.limit));
      }
      
      const querySnapshot = await getDocs(q);
      const projects = [];
      
      querySnapshot.forEach((doc) => {
        projects.push(doc.data());
      });
      
      return projects;
    } catch (error) {
      console.error('[FirebaseProjectService] Error searching projects:', error);
      throw error;
    }
  }

  /**
   * Update a project
   */
  async updateProject(projectId, updates) {
    await this.initialize();
    
    try {
      const projectRef = doc(this.db, 'projects', projectId);
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        version: (updates.version || 0) + 1
      };
      
      await setDoc(projectRef, updateData, { merge: true });
      console.log('[FirebaseProjectService] Project updated:', projectId);
      
      return updateData;
    } catch (error) {
      console.error('[FirebaseProjectService] Error updating project:', error);
      throw error;
    }
  }
}

module.exports = new FirebaseProjectService();
