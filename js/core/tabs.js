// Core tab operations without any DOM manipulation

// Simple text vectorization and clustering implementation
class TextProcessor {
  constructor() {
    // Common English stop words to filter out
    this.stopWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "by",
      "of",
      "about",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "doing",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "this",
      "that",
      "these",
      "those",
      "am",
      "your",
      "his",
      "her",
      "its",
      "our",
      "their",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "when",
      "where",
      "why",
      "how",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "some",
      "such",
      "no",
      "not",
      "only",
      "same",
      "than",
      "too",
      "very",
    ]);
  }

  // Extract meaningful words from text
  tokenize(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ") // Replace punctuation with spaces
      .split(/\s+/) // Split on whitespace
      .filter(
        (word) =>
          word.length > 2 && // Only words longer than 2 characters
          !this.stopWords.has(word) // Not a stop word
      );
  }

  // Create a TF (Term Frequency) vector for a document
  vectorize(text, allTerms) {
    const terms = this.tokenize(text);
    const termFreq = {};

    // Count term frequencies
    terms.forEach((term) => {
      if (!termFreq[term]) termFreq[term] = 0;
      termFreq[term]++;
    });

    // Create vector using the global term list
    const vector = Array(allTerms.length).fill(0);
    allTerms.forEach((term, index) => {
      if (termFreq[term]) {
        vector[index] = termFreq[term];
      }
    });

    return vector;
  }

  // Compute cosine similarity between two vectors
  cosineSimilarity(vecA, vecB) {
    // Dot product
    let dotProduct = 0;
    // Magnitudes
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magA += vecA[i] * vecA[i];
      magB += vecB[i] * vecB[i];
    }

    // Handle zero vectors
    if (magA === 0 || magB === 0) return 0;

    return dotProduct / (Math.sqrt(magA) * Math.sqrt(magB));
  }

  // Extract domain from URL
  getDomain(url) {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch (e) {
      return "";
    }
  }

  // Group tabs based on text similarity
  groupTabsBySimilarity(tabs, similarityThreshold = 0.3) {
    if (!tabs || tabs.length < 2) return [tabs];

    // Extract text content from tabs
    const tabContents = tabs.map((tab) => ({
      text: (tab.title + " " + this.getDomain(tab.url)).toLowerCase(),
      tab,
    }));

    // Get all unique terms to build our term space
    const allTerms = new Set();
    tabContents.forEach((content) => {
      const terms = this.tokenize(content.text);
      terms.forEach((term) => allTerms.add(term));
    });

    const termsList = Array.from(allTerms);

    // Create vectors for each tab's content
    const vectors = tabContents.map((content) =>
      this.vectorize(content.text, termsList)
    );

    // Build a similarity matrix
    const similarityMatrix = [];
    for (let i = 0; i < tabs.length; i++) {
      similarityMatrix[i] = [];
      for (let j = 0; j < tabs.length; j++) {
        if (i === j) {
          similarityMatrix[i][j] = 1; // Self similarity is 1
        } else {
          similarityMatrix[i][j] = this.cosineSimilarity(
            vectors[i],
            vectors[j]
          );
        }
      }
    }

    // Use a simple clustering approach based on similarity threshold
    const visited = new Set();
    const clusters = [];

    for (let i = 0; i < tabs.length; i++) {
      if (visited.has(i)) continue;

      const cluster = [i];
      visited.add(i);

      for (let j = 0; j < tabs.length; j++) {
        if (i === j || visited.has(j)) continue;

        if (similarityMatrix[i][j] > similarityThreshold) {
          cluster.push(j);
          visited.add(j);
        }
      }

      clusters.push(cluster.map((idx) => tabs[idx]));
    }

    return clusters;
  }

  // Find common words across a group of tabs
  findCommonTerms(tabs) {
    // Word count across all tabs
    const wordCounts = {};

    // Tokenize each tab title
    tabs.forEach((tab) => {
      const terms = this.tokenize(tab.title);

      // Count unique terms per tab (not counting duplicates within same tab)
      const uniqueTerms = new Set(terms);
      uniqueTerms.forEach((term) => {
        if (!wordCounts[term]) wordCounts[term] = 0;
        wordCounts[term]++;
      });
    });

    // Find words that appear in at least half of the tabs
    const threshold = Math.max(1, Math.ceil(tabs.length / 3));
    return Object.entries(wordCounts)
      .filter(([word, count]) => count >= threshold)
      .sort((a, b) => b[1] - a[1]) // Sort by frequency
      .map(([word]) => word);
  }

  // Generate a descriptive name for a cluster of tabs
  generateClusterName(tabs) {
    if (!tabs || tabs.length === 0) return "New Group";

    // Check if all tabs are from the same domain
    const domains = tabs.map((tab) => this.getDomain(tab.url));
    const uniqueDomains = [...new Set(domains.filter(Boolean))];

    if (uniqueDomains.length === 1) {
      return uniqueDomains[0];
    }

    // Try to find common terms in the titles
    const commonTerms = this.findCommonTerms(tabs);
    if (commonTerms.length > 0) {
      return commonTerms.slice(0, 2).join(" ");
    }

    // If no common terms, use the most frequent domain
    if (domains.length > 0) {
      const domainCounts = {};
      domains.forEach((domain) => {
        if (!domainCounts[domain]) domainCounts[domain] = 0;
        domainCounts[domain]++;
      });

      const topDomain = Object.entries(domainCounts).sort(
        (a, b) => b[1] - a[1]
      )[0][0];
      return topDomain;
    }

    return "Similar Tabs";
  }
}

export class TabManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.colors = ["blue", "red", "yellow", "green", "pink", "purple", "cyan"];
    this.textProcessor = new TextProcessor();
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
    const hash = Array.from(text.toLowerCase()).reduce(
      (acc, char) => acc + char.charCodeAt(0),
      0
    );
    return this.colors[hash % this.colors.length];
  }

  async createTabGroup(tabs, title, color = "grey") {
    if (!Array.isArray(tabs) || tabs.length < 2) return null;

    try {
      const tabIds = tabs.map((tab) => tab.id);
      const group = await chrome.tabs.group({ tabIds });
      await chrome.tabGroups.update(group, {
        title: title || "New Group",
        color,
        collapsed: false,
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
        this.settingsManager.loadSettings(),
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
              customGroup: this.findMatchingCustomGroup(tab, customGroups),
            });
          }
          domains.get(domain).tabs.push(tab);
        } catch (error) {
          console.warn("Invalid URL:", tab.url);
        }
      }

      // Create tab groups
      const groupPromises = Array.from(domains.entries()).map(
        async ([domain, domainData]) => {
          const { tabs, customGroup } = domainData;
          const title = customGroup
            ? customGroup.name
            : domain.replace(/^www\./, "");
          const color = customGroup
            ? customGroup.color || "grey"
            : this.getColorForText(domain);
          return this.createTabGroup(tabs, title, color);
        }
      );

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
      if (
        group.keywords.some(
          (keyword) => keyword && tabText.includes(keyword.toLowerCase())
        )
      ) {
        return group;
      }
    }
    return null;
  }

  async groupTabsByAI() {
    try {
      const [tabs, settings] = await Promise.all([
        this.getAllTabs(),
        this.settingsManager.loadSettings(),
      ]);

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
              color: matchingGroup.color || "grey",
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
          return this.createTabGroup(
            groupData.tabs,
            groupName,
            groupData.color
          );
        }
      );

      await Promise.all(matchedGroupPromises);

      // Use our custom text similarity approach to group remaining tabs
      if (unmatchedTabs.length > 0) {
        const tabClusters =
          this.textProcessor.groupTabsBySimilarity(unmatchedTabs);

        const clusterPromises = tabClusters.map(async (cluster) => {
          if (cluster.length < 2) return null; // Skip single tabs

          const clusterName = this.textProcessor.generateClusterName(cluster);
          const color = this.getColorForText(clusterName);
          return this.createTabGroup(cluster, clusterName, color);
        });

        await Promise.all(clusterPromises.filter(Boolean));
      }
    } catch (error) {
      console.error("Error grouping tabs by AI:", error);
      throw new Error("Failed to group tabs by AI");
    }
  }

  findCommonWords(titles) {
    // Tokenize and count words
    const wordCounts = {};
    const stopWords = new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "with",
      "by",
      "of",
    ]);

    titles.forEach((title) => {
      const words = title
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 2 && !stopWords.has(word));

      words.forEach((word) => {
        if (!wordCounts[word]) wordCounts[word] = 0;
        wordCounts[word]++;
      });
    });

    // Find words that appear in at least half the titles
    const threshold = Math.max(1, Math.floor(titles.length / 2));
    const common = Object.entries(wordCounts)
      .filter(([word, count]) => count >= threshold)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([word]) => word);

    return common;
  }

  async ungroupAllTabs() {
    try {
      const tabs = await this.getAllTabs();
      const groupedTabs = tabs.filter((tab) => tab.groupId !== -1);

      if (groupedTabs.length === 0) return;

      const ungroupPromises = groupedTabs.map((tab) =>
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

      const tabIds = tabs.map((tab) => tab.id);
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
        collapsed: isCollapsed,
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

      const updatePromises = tabGroups.map(async (group) => {
        const groupId = group.id.toString();
        if (groupId in collapsedStates) {
          await chrome.tabGroups.update(group.id, {
            collapsed: collapsedStates[groupId],
          });
        }
      });

      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error syncing collapsed states:", error);
    }
  }

  async collapseAllTabGroups() {
    try {
      // Get all tab groups
      const tabGroups = await this.getAllTabGroups();
      if (tabGroups.length === 0) return;

      // Create a batch of promises to update each group
      const updatePromises = tabGroups.map(async (group) => {
        // Update the browser tab group
        await chrome.tabGroups.update(group.id, { collapsed: true });

        // Update our saved state
        await this.settingsManager.setCollapsedState(group.id.toString(), true);
      });

      // Also set ungrouped tabs as collapsed in our saved state
      await this.settingsManager.setCollapsedState("ungrouped", true);

      await Promise.all(updatePromises);

      // Return the updated collapse states for UI update
      return {
        allCollapsed: true,
        groupIds: tabGroups.map((group) => group.id.toString()),
        includeUngrouped: true,
      };
    } catch (error) {
      console.error("Error collapsing all tab groups:", error);
      throw new Error("Failed to collapse all tab groups");
    }
  }

  async expandAllTabGroups() {
    try {
      // Get all tab groups
      const tabGroups = await this.getAllTabGroups();
      if (tabGroups.length === 0) return;

      // Create a batch of promises to update each group
      const updatePromises = tabGroups.map(async (group) => {
        // Update the browser tab group
        await chrome.tabGroups.update(group.id, { collapsed: false });

        // Update our saved state
        await this.settingsManager.setCollapsedState(
          group.id.toString(),
          false
        );
      });

      // Also set ungrouped tabs as expanded in our saved state
      await this.settingsManager.setCollapsedState("ungrouped", false);

      await Promise.all(updatePromises);

      // Return the updated collapse states for UI update
      return {
        allCollapsed: false,
        groupIds: tabGroups.map((group) => group.id.toString()),
        includeUngrouped: true,
      };
    } catch (error) {
      console.error("Error expanding all tab groups:", error);
      throw new Error("Failed to expand all tab groups");
    }
  }
}
