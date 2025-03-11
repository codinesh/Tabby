// Core tab operations without any DOM manipulation
export class TabManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.colors = ["blue", "red", "yellow", "green", "pink", "purple", "cyan"];
  }

  async getAllTabs() {
    try {
      return await chrome.tabs.query({});
    } catch (error) {
      console.error("Error getting tabs:", error);
      throw new Error("Failed to get tabs");
    }
  }

  async getAllTabGroups() {
    try {
      return await chrome.tabGroups.query({});
    } catch (error) {
      console.error("Error getting tab groups:", error);
      throw new Error("Failed to get tab groups");
    }
  }

  getColorForText(text) {
    if (!text) return "grey";
    const hash = Array.from(text.toLowerCase())
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return this.colors[hash % this.colors.length];
  }

  async createTabGroup(tabs, title, color = "grey") {
    if (!Array.isArray(tabs) || tabs.length < 2) return null;

    try {
      const tabIds = tabs.map(tab => tab.id);
      const group = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(group, {
        title: title || "New Group",
        color,
        collapsed: false
      });
      return group;
    } catch (error) {
      console.error("Error creating group:", title, error);
      throw new Error(`Failed to create group: ${title}`);
    }
  }

  async groupTabsByDomain() {
    try {
      const [tabs, settings] = await Promise.all([
        this.getAllTabs(),
        this.settingsManager.loadSettings()
      ]);

      const domains = new Map();
      const customGroups = settings.customGroups || [];
      
      // Group tabs by domain
      for (const tab of tabs) {
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
        } catch (error) {
          console.warn("Invalid URL:", tab.url);
        }
      }

      // Create tab groups
      const groupPromises = Array.from(domains.entries()).map(async ([domain, domainData]) => {
        const { tabs, customGroup } = domainData;
        const title = customGroup ? customGroup.name : domain.replace(/^www\./, '');
        const color = customGroup ? customGroup.color || "grey" : this.getColorForText(domain);
        return this.createTabGroup(tabs, title, color);
      });

      await Promise.all(groupPromises);
    } catch (error) {
      console.error("Error grouping tabs by domain:", error);
      throw new Error("Failed to group tabs by domain");
    }
  }

  findMatchingCustomGroup(tab, customGroups) {
    if (!Array.isArray(customGroups) || !tab) return null;

    for (const group of customGroups) {
      if (!group?.keywords?.length) continue;
      
      const tabText = (tab.title + " " + tab.url).toLowerCase();
      if (group.keywords.some(keyword => 
        keyword && tabText.includes(keyword.toLowerCase())
      )) {
        return group;
      }
    }
    return null;
  }

  async groupTabsByAI() {
    try {
      const [tabs, settings] = await Promise.all([
        this.getAllTabs(),
        this.settingsManager.loadSettings()
      ]);

      if (!settings.apiKey) {
        throw new Error("API key not configured");
      }

      const customGroups = settings.customGroups || [];
      const matchedGroups = new Map();
      const unmatchedTabs = [];

      // First try to match with custom groups
      for (const tab of tabs) {
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
      }

      // Create groups for matched tabs
      const matchedGroupPromises = Array.from(matchedGroups.entries()).map(
        async ([groupName, groupData]) => {
          return this.createTabGroup(groupData.tabs, groupName, groupData.color);
        }
      );

      await Promise.all(matchedGroupPromises);

      // Use AI to categorize remaining tabs
      if (unmatchedTabs.length > 0) {
        const categories = await this.callAIApi(settings.apiUrl, settings.apiKey, unmatchedTabs);
        
        // Create AI-suggested groups in parallel
        const aiGroupPromises = categories.map(category => {
          const categoryTabs = category.indices.map(i => unmatchedTabs[i]);
          const color = this.getColorForText(category.category);
          return this.createTabGroup(categoryTabs, category.category, color);
        });

        await Promise.all(aiGroupPromises);
      }
    } catch (error) {
      console.error("Error grouping tabs by AI:", error);
      throw error;
    }
  }

  async callAIApi(apiUrl, apiKey, tabs) {
    if (!apiUrl || !apiKey || !Array.isArray(tabs) || tabs.length === 0) {
      throw new Error("Invalid parameters for AI API call");
    }

    const tabInfo = tabs.map(tab => ({
      title: tab.title,
      url: tab.url
    }));

    try {
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
              content: "You are a helpful assistant that categorizes browser tabs into groups. Return a JSON array where each element has a 'category' and 'indices' field. The category should be a short, descriptive name, and indices should be an array of tab indices that belong to that category. IMPORTANT: Return ONLY the JSON array, with no markdown formatting or explanation."
            },
            {
              role: "user",
              content: `Please categorize these tabs:\n${JSON.stringify(tabInfo, null, 2)}`
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!data?.choices?.[0]?.message?.content) {
        throw new Error("Invalid API response format");
      }

      const content = data.choices[0].message.content;
      const jsonStr = content.replace(/```json\n|\n```|```/g, '').trim();
      
      try {
        const parsed = JSON.parse(jsonStr);
        if (!Array.isArray(parsed)) {
          throw new Error("Response is not an array");
        }
        return parsed;
      } catch (error) {
        console.error("Failed to parse AI response:", jsonStr);
        throw new Error("Invalid JSON response from AI");
      }
    } catch (error) {
      console.error("AI API call failed:", error);
      throw new Error("Failed to get AI categories: " + error.message);
    }
  }

  async ungroupAllTabs() {
    try {
      const tabs = await this.getAllTabs();
      const groupedTabs = tabs.filter(tab => tab.groupId !== -1);
      
      if (groupedTabs.length === 0) return;

      const ungroupPromises = groupedTabs.map(tab => 
        chrome.tabs.ungroup(tab.id)
      );
      
      await Promise.all(ungroupPromises);
    } catch (error) {
      console.error("Error ungrouping tabs:", error);
      throw new Error("Failed to ungroup tabs");
    }
  }

  async activateTab(tabId, windowId) {
    try {
      await chrome.windows.update(windowId, { focused: true });
      await chrome.tabs.update(tabId, { active: true });
    } catch (error) {
      console.error("Error activating tab:", error);
      throw new Error("Failed to activate tab");
    }
  }

  async closeTab(tabId) {
    try {
      await chrome.tabs.remove(tabId);
    } catch (error) {
      console.error("Error closing tab:", error);
      throw new Error("Failed to close tab");
    }
  }

  async closeTabGroup(groupId) {
    try {
      const tabs = await chrome.tabs.query({ groupId });
      if (tabs.length === 0) return;

      const tabIds = tabs.map(tab => tab.id);
      await chrome.tabs.remove(tabIds);
    } catch (error) {
      console.error("Error closing tab group:", error);
      throw new Error("Failed to close tab group");
    }
  }

  async setTabGroupCollapsed(groupId, isCollapsed) {
    try {
      if (groupId === "ungrouped" || groupId === -1) {
        return; // Skip for ungrouped tabs which don't have a browser tab group
      }
      
      await chrome.tabGroups.update(parseInt(groupId), {
        collapsed: isCollapsed
      });
      
      // Also update our saved state
      await this.settingsManager.setCollapsedState(groupId, isCollapsed);
    } catch (error) {
      console.error("Error updating tab group collapsed state:", error);
      throw new Error("Failed to update tab group collapsed state");
    }
  }
  
  async syncSavedCollapsedStates() {
    try {
      const collapsedStates = await this.settingsManager.getCollapsedStates();
      const tabGroups = await this.getAllTabGroups();
      
      const updatePromises = tabGroups.map(async group => {
        const groupId = group.id.toString();
        if (groupId in collapsedStates) {
          await chrome.tabGroups.update(group.id, {
            collapsed: collapsedStates[groupId]
          });
        }
      });
      
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error syncing collapsed states:", error);
    }
  }
}
