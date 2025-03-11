// Settings management functionality
export class SettingsManager {
  constructor() {
    this.defaultSettings = {
      apiUrl: "https://api.openai.com/v1/chat/completions",
      theme: "system",
      customGroups: [],
      apiKey: "",
      collapsedGroups: {}
    };
  }

  processCustomGroups(groups) {
    if (!Array.isArray(groups)) return [];
    return groups.map(group => ({
      ...group,
      keywords: Array.isArray(group.keywords) 
        ? group.keywords 
        : (group.keywords || "").split(',').map(k => k.trim()).filter(Boolean)
    }));
  }

  async saveSettings(settings) {
    const validatedSettings = {
      apiUrl: settings.apiUrl || this.defaultSettings.apiUrl,
      apiKey: settings.apiKey || "",
      theme: settings.theme || this.defaultSettings.theme,
      customGroups: settings.customGroups ? this.processCustomGroups(settings.customGroups) : []
    };

    try {
      await chrome.storage.sync.set(validatedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
      throw new Error("Failed to save settings");
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(Object.keys(this.defaultSettings));
      return {
        apiUrl: result.apiUrl || this.defaultSettings.apiUrl,
        apiKey: result.apiKey || "",
        customGroups: this.processCustomGroups(result.customGroups),
        theme: result.theme || this.defaultSettings.theme
      };
    } catch (error) {
      console.error("Error loading settings:", error);
      return { ...this.defaultSettings };
    }
  }

  async saveCustomGroups(groups) {
    try {
      const processedGroups = this.processCustomGroups(groups);
      await chrome.storage.sync.set({ customGroups: processedGroups });
    } catch (error) {
      console.error("Error saving custom groups:", error);
      throw new Error("Failed to save custom groups");
    }
  }

  async getCustomGroups() {
    try {
      const { customGroups } = await chrome.storage.sync.get(["customGroups"]);
      return this.processCustomGroups(customGroups);
    } catch (error) {
      console.error("Error getting custom groups:", error);
      return [];
    }
  }

  async saveTheme(theme) {
    try {
      if (!theme) throw new Error("Invalid theme");
      await chrome.storage.sync.set({ theme });
    } catch (error) {
      console.error("Error saving theme:", error);
      throw new Error("Failed to save theme");
    }
  }

  async getTheme() {
    try {
      const { theme } = await chrome.storage.sync.get(["theme"]);
      return theme || this.defaultSettings.theme;
    } catch (error) {
      console.error("Error getting theme:", error);
      return this.defaultSettings.theme;
    }
  }

  async setCollapsedState(groupId, isCollapsed) {
    try {
      if (!groupId) throw new Error("Invalid group ID");
      const { collapsedGroups = {} } = await chrome.storage.local.get(["collapsedGroups"]);
      collapsedGroups[groupId] = Boolean(isCollapsed);
      await chrome.storage.local.set({ collapsedGroups });
    } catch (error) {
      console.error("Error setting collapsed state:", error);
      throw new Error("Failed to save collapsed state");
    }
  }

  async getCollapsedStates() {
    try {
      const { collapsedGroups } = await chrome.storage.local.get(["collapsedGroups"]);
      return collapsedGroups || this.defaultSettings.collapsedGroups;
    } catch (error) {
      console.error("Error getting collapsed states:", error);
      return this.defaultSettings.collapsedGroups;
    }
  }
}
