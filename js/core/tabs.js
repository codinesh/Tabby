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

  async getSettings() {
    const result = await chrome.storage.sync.get(['apiKey', 'aiUrl', 'customGroups']);
    return {
      apiKey: result.apiKey || '',
      apiUrl: result.aiUrl || 'https://api.openai.com/v1/chat/completions',
      customGroups: result.customGroups || []
    };
  }

  async groupTabsByDomain() {
    const tabs = await this.getAllTabs();
    const domains = new Map();
    
    // Group tabs by domain
    tabs.forEach(tab => {
      try {
        const url = new URL(tab.url);
        const domain = url.hostname;
        if (!domains.has(domain)) {
          domains.set(domain, []);
        }
        domains.get(domain).push(tab);
      } catch (e) {
        // Skip invalid URLs
        console.error("Invalid URL:", tab.url);
      }
    });

    // Create tab groups
    for (const [domain, domainTabs] of domains) {
      if (domainTabs.length > 1) {
        try {
          const tabIds = domainTabs.map(tab => tab.id);
          const group = await chrome.tabs.group({ tabIds });
          const category = await this.getDomainCategory(domain, domainTabs);
          await chrome.tabGroups.update(group, {
            title: category.title,
            color: category.color,
            collapsed: false
          });
        } catch (e) {
          console.error("Error creating group for domain:", domain, e);
        }
      }
    }
  }

  async getDomainCategory(domain, tabs) {
    // First check user-configured groups
    const settings = await this.getSettings();
    const customGroups = settings.customGroups || [];

    // Check if any tab in this group matches user-defined keywords
    for (const group of customGroups) {
      const keywords = group.keywords.toLowerCase().split(',').map(k => k.trim());
      const matchingTab = tabs.find(tab => 
        keywords.some(keyword => 
          tab.title.toLowerCase().includes(keyword) || 
          tab.url.toLowerCase().includes(keyword)
        )
      );

      if (matchingTab) {
        return {
          title: group.name,
          color: group.color || 'grey'
        };
      }
    }

    // If no custom group matches, use the domain name
    return {
      title: domain.replace(/^www\./, ''),
      color: 'grey'
    };
  }

  async groupTabsByAI() {
    const tabs = await this.getAllTabs();
    const settings = await this.getSettings();
    
    if (!settings.apiKey) {
      throw new Error("API key not configured");
    }

    const customGroups = settings.customGroups || [];

    // First try to match with custom groups
    const matchedGroups = new Map();
    const unmatchedTabs = [];

    tabs.forEach(tab => {
      let matched = false;
      for (const group of customGroups) {
        const keywords = group.keywords.toLowerCase().split(',').map(k => k.trim());
        if (keywords.some(keyword => 
          tab.title.toLowerCase().includes(keyword) || 
          tab.url.toLowerCase().includes(keyword)
        )) {
          if (!matchedGroups.has(group.name)) {
            matchedGroups.set(group.name, {
              tabs: [],
              color: group.color || 'grey'
            });
          }
          matchedGroups.get(group.name).tabs.push(tab);
          matched = true;
          break;
        }
      }
      if (!matched) {
        unmatchedTabs.push(tab);
      }
    });

    // Create groups for matched tabs
    for (const [groupName, groupData] of matchedGroups) {
      if (groupData.tabs.length > 1) {
        const tabIds = groupData.tabs.map(tab => tab.id);
        const group = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(group, {
          title: groupName,
          color: groupData.color,
          collapsed: false
        });
      }
    }

    // Use AI to categorize remaining tabs
    if (unmatchedTabs.length > 0) {
      const categories = await this.callAIApi(settings.apiUrl, settings.apiKey, unmatchedTabs);
      
      // Create AI-suggested groups
      for (const category of categories) {
        const tabIds = category.indices.map(i => unmatchedTabs[i].id);
        if (tabIds.length > 1) {
          const group = await chrome.tabs.group({ tabIds });
          await chrome.tabGroups.update(group, {
            title: category.category,
            color: 'blue',
            collapsed: false
          });
        }
      }
    }
  }

  async callAIApi(apiUrl, apiKey, tabs) {
    const tabInfo = tabs.map(tab => ({
      title: tab.title,
      url: tab.url
    }));

    const response = await fetch(apiUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that categorizes browser tabs into groups. Respond only with a JSON array where each element has a "category" and "indices" field. The category should be a short, descriptive name, and indices should be an array of tab indices that belong to that category.'
          },
          {
            role: 'user',
            content: `Please categorize these tabs:\n${JSON.stringify(tabInfo, null, 2)}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to get AI categories');
    }

    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
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
