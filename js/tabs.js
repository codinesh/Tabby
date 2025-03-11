import { showStatus, showLoading } from './status.js';
import { renderTab } from './tab-renderer.js';
import { toggleGroupCollapse } from './ui.js';

// Function to display all tabs organized by groups
export function displayTabs() {
  const tabsList = document.getElementById("tabs-list");
  tabsList.innerHTML = "";

  chrome.tabs.query({}, (tabs) => {
    const groupedTabs = {};
    const ungroupedTabs = [];

    // First pass: identify groups
    tabs.forEach((tab) => {
      if (tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE) {
        if (!groupedTabs[tab.groupId]) {
          groupedTabs[tab.groupId] = {
            id: tab.groupId,
            tabs: [],
            title: null,
            color: null,
          };
        }
        groupedTabs[tab.groupId].tabs.push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    });

    // Get collapsed state
    chrome.storage.local.get(["collapsedGroups"], (result) => {
      const collapsedGroups = result.collapsedGroups || {};

      // Render groups
      Object.values(groupedTabs).forEach((group) => {
        // Add validation to ensure group ID is valid (must be >= 0)
        if (group && group.id != null && group.id >= 0) {
          chrome.tabGroups.get(group.id, (tabGroup) => {
            if (chrome.runtime.lastError) {
              console.error("Error getting tab group:", chrome.runtime.lastError);
              // Render the group with default values if we can't get details
              renderTabGroup(
                group,
                { title: "Unknown Group", color: "grey" },
                collapsedGroups[group.id]
              );
            } else {
              renderTabGroup(group, tabGroup, collapsedGroups[group.id]);
            }
          });
        } else {
          console.warn("Invalid group ID detected:", group.id);
          // Still render the group with default values
          renderTabGroup(
            group,
            { title: "Unknown Group", color: "grey" },
            collapsedGroups[group.id]
          );
        }
      });

      // Render ungrouped tabs
      ungroupedTabs.forEach((tab) => renderTab(tab));
    });
  });
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
  collapseIndicator.textContent = "▼";

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
  groupCloseBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    // Close all tabs in this group
    const tabIds = group.tabs.map((tab) => tab.id);
    chrome.tabs.remove(tabIds);
    groupContainer.remove();
  });

  groupActions.appendChild(groupCloseBtn);
  groupHeader.appendChild(groupActions);

  // Make the header clickable to collapse/expand
  groupHeader.addEventListener("click", () => {
    toggleGroupCollapse(groupContainer);
  });

  // Add group header to container
  groupContainer.appendChild(groupHeader);

  // Add tabs within this group
  group.tabs.forEach((tab) => {
    renderTab(tab, groupContainer);
  });

  // Check if only one tab is in the group and add a special indicator
  if (group.tabs.length === 1) {
    const singleTabIndicator = document.createElement("div");
    singleTabIndicator.className = "single-tab-indicator";
    singleTabIndicator.textContent = "Single tab in group - consider ungrouping";
    singleTabIndicator.addEventListener("click", () => {
      // Ungroup the single tab
      chrome.tabs.ungroup(group.tabs[0].id, () => {
        if (chrome.runtime.lastError) {
          console.error("Error ungrouping tab:", chrome.runtime.lastError);
          showStatus("Error ungrouping tab", "error");
        } else {
          showStatus("Tab ungrouped", "success");
          displayTabs();
        }
      });
    });
    groupContainer.appendChild(singleTabIndicator);
  }

  tabsList.appendChild(groupContainer);
}

// Function to refresh tabs list
export function refreshTabsList() {
  showLoading("Refreshing tabs list...");
  displayTabs();
  showStatus("Tabs list refreshed", "success");
}

// Group tabs by domain
export function groupTabsByDomain() {
  chrome.tabs.query({}, (tabs) => {
    // Create map of domains to tab IDs
    const domainMap = new Map();

    tabs.forEach((tab) => {
      try {
        const url = new URL(tab.url);
        const domain = url.hostname;
        if (!domainMap.has(domain)) {
          domainMap.set(domain, []);
        }
        domainMap.get(domain).push(tab.id);
      } catch (e) {
        console.warn("Invalid URL:", tab.url);
      }
    });

    // Create groups for each domain with more than one tab
    domainMap.forEach((tabIds, domain) => {
      if (tabIds.length > 1) {
        chrome.tabs.group({ tabIds }, (groupId) => {
          if (chrome.runtime.lastError) {
            console.error("Error creating group:", chrome.runtime.lastError);
            return;
          }
          // Set group title to domain
          chrome.tabGroups.update(groupId, { title: domain });
        });
      }
    });

    // Refresh the display after grouping
    setTimeout(displayTabs, 500);
  });
}

// Ungroup all tabs
export function ungroupAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    const groupedTabs = tabs.filter(
      (tab) => tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE
    );
    const tabIds = groupedTabs.map((tab) => tab.id);

    if (tabIds.length > 0) {
      chrome.tabs.ungroup(tabIds, () => {
        if (chrome.runtime.lastError) {
          console.error("Error ungrouping tabs:", chrome.runtime.lastError);
          showStatus("Error ungrouping tabs", "error");
        } else {
          showStatus("All tabs ungrouped", "success");
          displayTabs();
        }
      });
    }
  });
}
