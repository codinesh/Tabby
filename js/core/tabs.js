// Core tab operations without any DOM manipulation
export class TabManager {
  constructor() {
    this.tabs = [];
    this.tabGroups = [];
  }

  async getAllTabs() {
    return await chrome.tabs.query({});
  }

  async getAllTabGroups() {
    return await chrome.tabGroups.query({});
  }

  async groupTabsByDomain() {
    const tabs = await this.getAllTabs();
    const domains = new Map();
    
    // Group tabs by domain
    tabs.forEach(tab => {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!domains.has(domain)) {
        domains.set(domain, []);
      }
      domains.get(domain).push(tab);
    });

    // Create tab groups
    for (const [domain, domainTabs] of domains) {
      if (domainTabs.length > 1) {
        const tabIds = domainTabs.map(tab => tab.id);
        const group = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(group, { title: domain });
      }
    }
  }

  async groupTabsByAI() {
    const tabs = await this.getAllTabs();
    const apiKey = await this.getApiKey();
    const apiUrl = await this.getApiUrl();

    if (!apiKey) {
      throw new Error("API key not found");
    }

    // Get tab titles and URLs for analysis
    const tabData = tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url
    }));

    // Call AI API to get groupings
    const groups = await this.callAIApi(apiUrl, apiKey, tabData);

    // Create tab groups based on AI suggestions
    for (const group of groups) {
      const tabIds = group.tabIds;
      if (tabIds.length > 1) {
        const groupId = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(groupId, { 
          title: group.name,
          color: group.color || 'grey'
        });
      }
    }
  }

  async ungroupAllTabs() {
    const tabs = await this.getAllTabs();
    const groupedTabs = tabs.filter(tab => tab.groupId !== -1);
    const tabIds = groupedTabs.map(tab => tab.id);
    await chrome.tabs.ungroup(tabIds);
  }

  async closeTab(tabId) {
    await chrome.tabs.remove(tabId);
  }

  async activateTab(tabId, windowId) {
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(windowId, { focused: true });
  }

  async getApiKey() {
    const result = await chrome.storage.sync.get(['apiKey']);
    return result.apiKey;
  }

  async getApiUrl() {
    const result = await chrome.storage.sync.get(['aiUrl']);
    return result.aiUrl || 'https://api.openai.com/v1/chat/completions';
  }

  async callAIApi(apiUrl, apiKey, tabData) {
    // Implementation of AI API call
    // Returns array of { name: string, tabIds: number[], color?: string }
    // This is a placeholder - actual implementation would depend on your AI service
    return [];
  }
}
