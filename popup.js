// Function to display all tabs
function displayTabs() {
  const tabsList = document.getElementById('tabs-list');
  tabsList.innerHTML = '';
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      const tabItem = document.createElement('div');
      tabItem.className = 'tab-item';
      tabItem.setAttribute('data-tab-id', tab.id);
      
      const favicon = document.createElement('img');
      favicon.className = 'tab-favicon';
      favicon.src = tab.favIconUrl || 'images/favicon.png';
      
      const title = document.createElement('div');
      title.className = 'tab-title';
      title.textContent = tab.title;
      
      const closeBtn = document.createElement('div');
      closeBtn.className = 'tab-close';
      closeBtn.textContent = '✕';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.tabs.remove(tab.id);
        tabItem.remove();
      });
      
      tabItem.appendChild(favicon);
      tabItem.appendChild(title);
      tabItem.appendChild(closeBtn);
      
      // Switch to this tab when clicked
      tabItem.addEventListener('click', () => {
        chrome.tabs.update(tab.id, { active: true });
        chrome.windows.update(tab.windowId, { focused: true });
      });
      
      tabsList.appendChild(tabItem);
    });
  });
}

// Group tabs by domain
function groupTabsByDomain() {
  chrome.tabs.query({}, (tabs) => {
    // Create a map of domains to tab IDs
    const domainGroups = {};
    
    tabs.forEach((tab) => {
      try {
        const url = new URL(tab.url);
        const domain = url.hostname;
        
        if (!domainGroups[domain]) {
          domainGroups[domain] = [];
        }
        
        domainGroups[domain].push(tab.id);
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    // Group tabs with the same domain
    for (const domain in domainGroups) {
      const tabIds = domainGroups[domain];
      if (tabIds.length > 1) {
        chrome.tabs.group({ tabIds }, (groupId) => {
          chrome.tabGroups.update(groupId, { title: domain });
        });
      }
    }
  });
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
  // Display all tabs
  displayTabs();
  
  // Add event listener for the refresh button
  document.getElementById('refresh').addEventListener('click', displayTabs);
  
  // Add event listener for the group tabs button
  document.getElementById('group-tabs').addEventListener('click', groupTabsByDomain);
});

// Listen for tab events and refresh the list
chrome.tabs.onCreated.addListener(displayTabs);
chrome.tabs.onRemoved.addListener(displayTabs);
chrome.tabs.onUpdated.addListener(displayTabs);