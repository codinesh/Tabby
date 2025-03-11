// Settings management functionality
export class SettingsManager {
  constructor() {
    this.defaultSettings = {
      apiUrl: "https://api.openai.com/v1/chat/completions",
      theme: "system",
      customGroups: [],
    };
  }

  processCustomGroups(groups) {
    if (!groups) return [];
    return groups.map(group => ({
      ...group,
      keywords: typeof group.keywords === 'string' 
        ? group.keywords.split(',').map(k => k.trim())
        : group.keywords
    }));
  }

  async saveSettings(settings) {
    if (settings.customGroups) {
      settings.customGroups = this.processCustomGroups(settings.customGroups);
    }
    await chrome.storage.sync.set(settings);
  }

  async loadSettings() {
    const result = await chrome.storage.sync.get([
      "apiUrl",
      "apiKey",
      "customGroups",
      "theme",
    ]);

    return {
      apiUrl: result.apiUrl || this.defaultSettings.apiUrl,
      apiKey: result.apiKey || "",
      customGroups: result.customGroups || [],
      theme: result.theme || this.defaultSettings.theme,
    };
  }

  async saveCustomGroups(groups) {
    const processedGroups = this.processCustomGroups(groups);
    await chrome.storage.sync.set({ customGroups: processedGroups });
  }

  async getCustomGroups() {
    const result = await chrome.storage.sync.get(["customGroups"]);
    return result.customGroups || [];
  }

  async saveTheme(theme) {
    await chrome.storage.sync.set({ theme });
  }

  async getTheme() {
    const result = await chrome.storage.sync.get(["theme"]);
    return result.theme || this.defaultSettings.theme;
  }

  async setCollapsedState(groupId, isCollapsed) {
    const result = await chrome.storage.local.get(["collapsedGroups"]);
    const collapsedGroups = result.collapsedGroups || {};
    collapsedGroups[groupId] = isCollapsed;
    await chrome.storage.local.set({ collapsedGroups });
  }

  async getCollapsedStates() {
    const result = await chrome.storage.local.get(["collapsedGroups"]);
    return result.collapsedGroups || {};
  }
}
