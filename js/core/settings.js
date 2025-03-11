// Core settings operations without any DOM manipulation
export class SettingsManager {
  constructor() {
    this.defaultSettings = {
      aiUrl: 'https://api.openai.com/v1/chat/completions',
      theme: 'system',
      customGroups: []
    };
  }

  async saveSettings(settings) {
    await chrome.storage.sync.set(settings);
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get([
      'aiUrl',
      'apiKey',
      'customGroups',
      'theme'
    ]);

    return {
      aiUrl: result.aiUrl || this.defaultSettings.aiUrl,
      apiKey: result.apiKey || '',
      customGroups: result.customGroups || [],
      theme: result.theme || this.defaultSettings.theme
    };
  }

  async saveCustomGroups(groups) {
    await chrome.storage.sync.set({ customGroups: groups });
  }

  async getCustomGroups() {
    const result = await chrome.storage.sync.get(['customGroups']);
    return result.customGroups || [];
  }

  async saveTheme(theme) {
    await chrome.storage.sync.set({ theme });
  }

  async getTheme() {
    const result = await chrome.storage.sync.get(['theme']);
    return result.theme || this.defaultSettings.theme;
  }

  async saveCollapsedState(groupId, isCollapsed) {
    const result = await chrome.storage.local.get(['collapsedGroups']);
    const collapsedGroups = result.collapsedGroups || {};
    collapsedGroups[groupId] = isCollapsed;
    await chrome.storage.local.set({ collapsedGroups });
  }

  async getCollapsedStates() {
    const result = await chrome.storage.local.get(['collapsedGroups']);
    return result.collapsedGroups || {};
  }
}
