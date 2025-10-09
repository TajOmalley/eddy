const { settingsService } = require('../../../settings/settingsService');

class SettingsRepository {
    async getSettings() {
        return await settingsService.getSettings();
    }

    async updateSettings(data) {
        return await settingsService.updateSettings(data);
    }
}

module.exports = new SettingsRepository();
