const { modelStateService } = require('../../services/modelStateService');

class ModelStateRepository {
    async getModelState() {
        return await modelStateService.getModelState();
    }

    async updateModelState(data) {
        return await modelStateService.updateModelState(data);
    }
}

module.exports = new ModelStateRepository();
