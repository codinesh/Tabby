import { SettingsManager } from "./js/core/settings.js";

// Track tab access times
const tabAccessTimes = new Map();
const settingsManager = new SettingsManager();

// Listen for tab activation to track last access time
chrome.tabs.onActivated.addListener((activeInfo) => {
  tabAccessTimes.set(activeInfo.tabId, Date.now());
});

// Listen for keyboard commands
chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "group_by_domain":
      groupTabsByDomain();
      break;
    case "ungroup_all":
      ungroupAllTabs();
      break;
  }
});

// Group tabs by domain
async function groupTabsByDomain() {
  console.log("Grouping tabs by domain...");
  const tabs = await chrome.tabs.query({});
  const domainGroups = new Map();

  // Get custom groups for domain categorization
  const customGroups = await settingsManager.getCustomGroups();

  // Group tabs by domain
  tabs.forEach((tab) => {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, {
          tabs: [],
          customGroup: findMatchingCustomGroup(tab, customGroups)
        });
      }
      domainGroups.get(domain).tabs.push(tab.id);
    } catch (e) {
      // Skip invalid URLs
      console.error("Invalid URL:", tab.url);
    }
  });

  // Create tab groups for each domain
  for (const [domain, groupData] of domainGroups) {
    const { tabs: tabIds, customGroup } = groupData;
    if (tabIds.length > 1) {
      try {
        const groupId = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(groupId, {
          title: customGroup ? customGroup.name : domain,
          color: customGroup ? (customGroup.color || 'grey') : getColorForDomain(domain),
        });
      } catch (e) {
        console.error("Error creating group for domain:", domain, e);
      }
    }
  }
}

function findMatchingCustomGroup(tab, customGroups) {
  for (const group of customGroups) {
    const keywords = group.keywords.toLowerCase().split(',').map(k => k.trim());
    if (keywords.some(keyword => 
      tab.title.toLowerCase().includes(keyword) || 
      tab.url.toLowerCase().includes(keyword)
    )) {
      return group;
    }
  }
  return null;
}

// Ungroup all tabs
async function ungroupAllTabs() {
  console.log("Ungrouping all tabs...");
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE) {
      try {
        await chrome.tabs.ungroup(tab.id);
      } catch (e) {
        console.error("Error ungrouping tab:", tab.id, e);
      }
    }
  }
}

// Generate consistent color for domain
function getColorForDomain(domain) {
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

// Handle installation and updates
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    // Set default settings on installation using SettingsManager
    await settingsManager.saveSettings({
      theme: "system",
      customGroups: [],
      aiUrl: "https://api.openai.com/v1/chat/completions"
    });
  }
});
