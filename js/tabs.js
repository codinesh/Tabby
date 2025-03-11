import { showStatus, showLoading } from './status.js';
import { renderTab } from './tab-renderer.js';
import { toggleGroupCollapse } from './ui.js';

// Function to display all tabs organized by groups
export async function displayTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    const tabGroups = await chrome.tabGroups.query({});
    const tabsList = document.getElementById("tabs-list");
    tabsList.innerHTML = "";

    // Get collapsed state from storage
    const { collapsedGroups = {} } = await chrome.storage.local.get(['collapsedGroups']);

    // Group tabs by their group ID
    const groupedTabs = {};
    for (const tab of tabs) {
      if (tab.groupId > 0) {
        if (!groupedTabs[tab.groupId]) {
          groupedTabs[tab.groupId] = { tabs: [] };
        }
        groupedTabs[tab.groupId].tabs.push(tab);
      }
    }

    // Add group information
    for (const group of tabGroups) {
      if (groupedTabs[group.id]) {
        groupedTabs[group.id] = { ...group, tabs: groupedTabs[group.id].tabs };
      }
    }

    // Render grouped tabs first
    for (const group of Object.values(groupedTabs)) {
      if (group.tabs && group.tabs.length > 0) {
        renderTabGroup(group, group, collapsedGroups[group.id] || false);
      }
    }

    // Render ungrouped tabs
    const ungroupedTabs = tabs.filter(tab => tab.groupId === -1);
    ungroupedTabs.forEach(tab => renderTab(tab, tabsList));

  } catch (error) {
    console.error('Error displaying tabs:', error);
    showStatus('Error displaying tabs', 'error');
  }
}

// Enhanced renderTabGroup function
export function renderTabGroup(group, tabGroup, isCollapsed) {
  const tabsList = document.getElementById("tabs-list");
  
  // Ensure tabGroup is valid
  tabGroup = tabGroup || { title: "Unknown Group", color: "grey" };

  const groupContainer = document.createElement("div");
  groupContainer.className = `tab-group ${isCollapsed ? "collapsed" : ""}`;
  groupContainer.setAttribute("data-group-id", group.id);

  const groupHeader = document.createElement("div");
  groupHeader.className = `group-header ${tabGroup.color || "grey"}`;

  const titleContainer = document.createElement("div");
  titleContainer.className = "title-container";

  const collapseIndicator = document.createElement("span");
  collapseIndicator.className = "collapse-indicator";
  collapseIndicator.textContent = isCollapsed ? "▶" : "▼";

  const groupTitle = document.createElement("span");
  groupTitle.className = "group-title";
  groupTitle.textContent = tabGroup.title || "Unnamed group";

  const tabCount = document.createElement("span");
  tabCount.className = "tab-count";
  tabCount.textContent = group.tabs.length;

  titleContainer.appendChild(collapseIndicator);
  titleContainer.appendChild(groupTitle);
  titleContainer.appendChild(tabCount);

  // Add the title container to the header
  groupHeader.appendChild(titleContainer);

  // Add actions container for group controls
  const groupActions = document.createElement("div");
  groupActions.className = "group-actions";

  // Add close button
  const groupCloseBtn = document.createElement("div");
  groupCloseBtn.className = "group-close";
  groupCloseBtn.textContent = "✕";
  groupCloseBtn.title = "Close group";
  groupCloseBtn.addEventListener("click", async (e) => {
    e.stopPropagation();
    // Close all tabs in this group
    const tabIds = group.tabs.map((tab) => tab.id);
    await chrome.tabs.remove(tabIds);
    groupContainer.remove();
  });

  groupActions.appendChild(groupCloseBtn);
  groupHeader.appendChild(groupActions);

  // Add click handler for group header to toggle collapse
  groupHeader.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleGroupCollapse(groupContainer);
  });

  // Add group header to container
  groupContainer.appendChild(groupHeader);

  // Add tabs within this group
  const tabsContainer = document.createElement("div");
  tabsContainer.className = "tabs-container";
  group.tabs.forEach((tab) => {
    renderTab(tab, tabsContainer);
  });
  groupContainer.appendChild(tabsContainer);

  // Check if only one tab is in the group and add a special indicator
  if (group.tabs.length === 1) {
    const singleTabIndicator = document.createElement("div");
    singleTabIndicator.className = "single-tab-indicator";
    singleTabIndicator.textContent = "Single tab in group - consider ungrouping";
    singleTabIndicator.addEventListener("click", async () => {
      // Ungroup the single tab
      try {
        await chrome.tabs.ungroup(group.tabs[0].id);
        showStatus("Tab ungrouped", "success");
        await displayTabs();
      } catch (error) {
        console.error("Error ungrouping tab:", error);
        showStatus("Error ungrouping tab", "error");
      }
    });
    groupContainer.appendChild(singleTabIndicator);
  }

  tabsList.appendChild(groupContainer);
}

// Group tabs by domain
export async function groupTabsByDomain() {
  try {
    showLoading(true);
    const tabs = await chrome.tabs.query({});
    const domains = {};

    // Group tabs by domain
    tabs.forEach(tab => {
      const url = new URL(tab.url);
      const domain = url.hostname;
      if (!domains[domain]) {
        domains[domain] = [];
      }
      domains[domain].push(tab);
    });

    // Create tab groups for each domain
    for (const [domain, domainTabs] of Object.entries(domains)) {
      if (domainTabs.length > 1) {
        const groupId = await chrome.tabs.group({ tabIds: domainTabs.map(tab => tab.id) });
        await chrome.tabGroups.update(groupId, { title: domain });
      }
    }

    showStatus('Tabs grouped by domain', 'success');
    await displayTabs();
  } catch (error) {
    console.error('Error grouping tabs:', error);
    showStatus('Error grouping tabs', 'error');
  } finally {
    showLoading(false);
  }
}

// Ungroup all tabs
export async function ungroupAllTabs() {
  try {
    showLoading(true);
    const tabs = await chrome.tabs.query({});
    await Promise.all(tabs.map(tab => chrome.tabs.ungroup(tab.id)));
    showStatus('All tabs ungrouped', 'success');
    await displayTabs();
  } catch (error) {
    console.error('Error ungrouping tabs:', error);
    showStatus('Error ungrouping tabs', 'error');
  } finally {
    showLoading(false);
  }
}

// Refresh tabs list
export async function refreshTabsList() {
  try {
    showLoading(true);
    await displayTabs();
    showStatus('Tabs refreshed', 'success');
  } catch (error) {
    console.error('Error refreshing tabs:', error);
    showStatus('Error refreshing tabs', 'error');
  } finally {
    showLoading(false);
  }
}
