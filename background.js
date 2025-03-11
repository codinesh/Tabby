// Track tab access times
const tabAccessTimes = new Map();

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

  // Group tabs by domain
  tabs.forEach((tab) => {
    try {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain).push(tab.id);
    } catch (e) {
      // Skip invalid URLs
      console.error("Invalid URL:", tab.url);
    }
  });

  // Create tab groups for each domain
  for (const [domain, tabIds] of domainGroups) {
    if (tabIds.length > 1) {
      try {
        const groupId = await chrome.tabs.group({ tabIds });
        await chrome.tabGroups.update(groupId, {
          title: domain,
          color: getColorForDomain(domain),
        });
      } catch (e) {
        console.error("Error creating group for domain:", domain, e);
      }
    }
  }
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
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Set default settings on installation
    chrome.storage.sync.set({
      theme: "system",
      customGroups: [],
    });
  }
});
