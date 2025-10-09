const { projectService } = require('../projectService');

class ProjectRepository {
    async getProjectData(projectId) {
        return await projectService.loadProject(projectId);
    }

    async updateProjectData(projectId, data) {
        // Update project data logic would go here
        // For now, just return success
        return { success: true, projectId, data };
    }
}

module.exports = new ProjectRepository();
