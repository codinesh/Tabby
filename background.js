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

// Check for inactive tabs periodically (every 30 minutes)
setInterval(checkInactiveTabs, 30 * 60 * 1000);

// Function to check and suspend inactive tabs
async function checkInactiveTabs() {
  // Get user preferences for auto-suspension
  const { autoSuspendEnabled, inactiveTimeout } = await chrome.storage.sync.get(
    {
      autoSuspendEnabled: false,
      inactiveTimeout: 30, // default 30 minutes
    }
  );

  if (!autoSuspendEnabled) return;

  const tabs = await chrome.tabs.query({});
  const currentTime = Date.now();
  const timeoutMs = inactiveTimeout * 60 * 1000;

  for (const tab of tabs) {
    const lastAccessed = tabAccessTimes.get(tab.id) || currentTime;
    if (currentTime - lastAccessed > timeoutMs) {
      try {
        // Don't suspend active tabs or already suspended tabs
        if (!tab.active && !tab.url.includes("suspended.html")) {
          const suspendUrl =
            chrome.runtime.getURL("suspended.html") +
            `?title=${encodeURIComponent(tab.title)}&url=${encodeURIComponent(
              tab.url
            )}`;
          await chrome.tabs.update(tab.id, { url: suspendUrl });
        }
      } catch (e) {
        console.error("Error suspending tab:", tab.id, e);
      }
    }
  }
}

// Handle installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Set default settings on installation
    chrome.storage.sync.set({
      theme: "system",
      autoSuspendEnabled: false,
      inactiveTimeout: 30,
      customGroups: [],
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "suspendInactiveTabs":
      checkInactiveTabs();
      sendResponse({ success: true });
      break;
    case "getTabStats":
      getTabStats().then(sendResponse);
      return true; // Required for async response
  }
});

// Get tab statistics
async function getTabStats() {
  const tabs = await chrome.tabs.query({});
  const groups = new Set();
  let totalMemory = 0;

  // Count groups and calculate memory usage
  tabs.forEach((tab) => {
    if (tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE) {
      groups.add(tab.groupId);
    }
    // Estimate memory usage (rough estimate)
    totalMemory += tab.url.includes("suspended.html") ? 1 : 10;
  });

  return {
    totalTabs: tabs.length,
    groupCount: groups.size,
    suspendedTabs: tabs.filter((tab) => tab.url.includes("suspended.html"))
      .length,
    estimatedMemory: totalMemory,
  };
}

// Initialize tab access times for existing tabs
chrome.tabs.query({}, (tabs) => {
  const currentTime = Date.now();
  tabs.forEach((tab) => {
    tabAccessTimes.set(tab.id, currentTime);
  });
});
