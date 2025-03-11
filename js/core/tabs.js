// Core tab operations without any DOM manipulation
export class TabManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.tabs = [];
    this.tabGroups = [];
  }

  async getAllTabs() {
    return await chrome.tabs.query({});
  }

  async getAllTabGroups() {
    return await chrome.tabGroups.query({});
  }

  async createTabGroup(tabs, title, color = "grey") {
    if (tabs.length > 1) {
      try {
        const tabIds = tabs.map(tab => tab.id);
        const group = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(group, {
          title,
          color,
          collapsed: false
        });
        return group;
      } catch (e) {
        console.error("Error creating group:", title, e);
        return null;
      }
    }
    return null;
  }

  async groupTabsByDomain() {
    const tabs = await this.getAllTabs();
    const domains = new Map();
    const settings = await this.settingsManager.loadSettings();
    const customGroups = settings.customGroups || [];
    
    // Group tabs by domain
    tabs.forEach(tab => {
      try {
        const url = new URL(tab.url);
        const domain = url.hostname;
        if (!domains.has(domain)) {
          domains.set(domain, {
            tabs: [],
            customGroup: this.findMatchingCustomGroup(tab, customGroups)
          });
        }
        domains.get(domain).tabs.push(tab);
      } catch (e) {
        console.error("Invalid URL:", tab.url);
      }
    });

    // Create tab groups
    for (const [domain, domainData] of domains) {
      const { tabs, customGroup } = domainData;
      const title = customGroup ? customGroup.name : domain.replace(/^www\./, '');
      const color = customGroup ? customGroup.color || "grey" : this.getColorForDomain(domain);
      await this.createTabGroup(tabs, title, color);
    }
  }

  findMatchingCustomGroup(tab, customGroups) {
    if (!customGroups) return null;

    for (const group of customGroups) {
      if (!group || !group.keywords || !Array.isArray(group.keywords)) continue;
      
      if (group.keywords.some(keyword => 
        tab.title.toLowerCase().includes(keyword.toLowerCase()) || 
        tab.url.toLowerCase().includes(keyword.toLowerCase())
      )) {
        return group;
      }
    }
    return null;
  }

  async groupTabsByAI() {
    const tabs = await this.getAllTabs();
    const settings = await this.settingsManager.loadSettings();
    
    if (!settings.apiKey) {
      throw new Error("API key not configured");
    }

    const customGroups = settings.customGroups || [];

    // First try to match with custom groups
    const matchedGroups = new Map();
    const unmatchedTabs = [];

    tabs.forEach(tab => {
      const matchingGroup = this.findMatchingCustomGroup(tab, customGroups);
      
      if (matchingGroup) {
        const groupName = matchingGroup.name;
        if (!matchedGroups.has(groupName)) {
          matchedGroups.set(groupName, {
            tabs: [],
            color: matchingGroup.color || 'grey'
          });
        }
        matchedGroups.get(groupName).tabs.push(tab);
      } else {
        unmatchedTabs.push(tab);
      }
    });

    // Create groups for matched tabs
    for (const [groupName, groupData] of matchedGroups) {
      await this.createTabGroup(groupData.tabs, groupName, groupData.color);
    }

    // Use AI to categorize remaining tabs
    if (unmatchedTabs.length > 0) {
      const categories = await this.callAIApi(settings.apiUrl, settings.apiKey, unmatchedTabs);
      
      // Create AI-suggested groups
      for (const category of categories) {
        const categoryTabs = category.indices.map(i => unmatchedTabs[i]);
        await this.createTabGroup(categoryTabs, category.category, 'blue');
      }
    }
  }

  async callAIApi(apiUrl, apiKey, tabs) {
    const tabInfo = tabs.map(tab => ({
      title: tab.title,
      url: tab.url
    }));

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that categorizes browser tabs into groups. Respond only with a JSON array where each element has a \"category\" and \"indices\" field. The category should be a short, descriptive name, and indices should be an array of tab indices that belong to that category."
          },
          {
            role: "user",
            content: `Please categorize these tabs:\n${JSON.stringify(tabInfo, null, 2)}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error("Failed to get AI categories");
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
  }

  getColorForDomain(domain) {
    const colors = [
      "grey",
      "blue",
      "red",
      "yellow",
      "green",
      "pink",
      "purple",
      "cyan",
    ];
    const hash = Array.from(domain).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    return colors[hash % colors.length];
  }

  async ungroupAllTabs() {
    const tabs = await this.getAllTabs();
    const groupedTabs = tabs.filter(tab => tab.groupId !== -1);
    for (const tab of groupedTabs) {
      await chrome.tabs.ungroup(tab.id);
    }
  }

  async closeTab(tabId) {
    await chrome.tabs.remove(tabId);
  }

  async activateTab(tabId, windowId) {
    await chrome.tabs.update(tabId, { active: true });
    await chrome.windows.update(windowId, { focused: true });
  }

  async ungroupTabs(groupId) {
    await chrome.tabGroups.ungroup(groupId);
  }
}
