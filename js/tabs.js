import { showStatus } from './status.js';

export async function displayTabs() {
  const tabsList = document.getElementById("tabs-list");
  tabsList.innerHTML = ''; // Clear existing tabs
  
  try {
    const tabs = await chrome.tabs.query({});
    const tabGroups = await chrome.tabGroups.query({});
    
    // Create a map of group IDs to their details
    const groupMap = new Map(tabGroups.map(group => [group.id, group]));
    
    // Separate grouped and ungrouped tabs
    const groupedTabs = new Map();
    const ungroupedTabs = [];
    
    tabs.forEach(tab => {
      if (tab.groupId !== -1) {
        if (!groupedTabs.has(tab.groupId)) {
          groupedTabs.set(tab.groupId, []);
        }
        groupedTabs.get(tab.groupId).push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    });
    
    // Display grouped tabs first
    for (const [groupId, tabs] of groupedTabs) {
      const group = groupMap.get(groupId);
      if (!group) continue;
      
      const groupElement = createGroupElement(group, tabs);
      tabsList.appendChild(groupElement);
    }
    
    // Display ungrouped tabs
    if (ungroupedTabs.length > 0) {
      const ungroupedElement = document.createElement('div');
      ungroupedElement.className = 'tab-group';
      
      const header = document.createElement('div');
      header.className = 'group-header';
      
      const collapseIndicator = document.createElement('span');
      collapseIndicator.className = 'collapse-indicator';
      collapseIndicator.textContent = '▼';
      
      const groupTitle = document.createElement('span');
      groupTitle.className = 'group-title';
      groupTitle.textContent = 'Ungrouped Tabs';
      
      const groupCount = document.createElement('span');
      groupCount.className = 'group-count';
      groupCount.textContent = `${ungroupedTabs.length} tabs`;
      
      header.appendChild(collapseIndicator);
      header.appendChild(groupTitle);
      header.appendChild(groupCount);
      
      const tabsContainer = document.createElement('div');
      tabsContainer.className = 'tabs-container';
      
      ungroupedTabs.forEach(tab => {
        const tabElement = createTabElement(tab);
        tabsContainer.appendChild(tabElement);
      });
      
      ungroupedElement.appendChild(header);
      ungroupedElement.appendChild(tabsContainer);
      tabsList.appendChild(ungroupedElement);
    }
    
    // Restore collapsed state
    chrome.storage.local.get(['collapsedGroups'], (result) => {
      const collapsedGroups = result.collapsedGroups || {};
      document.querySelectorAll('.tab-group').forEach(group => {
        const groupId = group.getAttribute('data-group-id');
        if (groupId && collapsedGroups[groupId]) {
          group.classList.add('collapsed');
          const indicator = group.querySelector('.collapse-indicator');
          if (indicator) {
            indicator.textContent = '▶';
          }
        }
      });
    });
    
  } catch (error) {
    showStatus('Error loading tabs: ' + error.message, 'error');
  }
}

function createGroupElement(group, tabs) {
  const groupElement = document.createElement('div');
  groupElement.className = 'tab-group';
  groupElement.setAttribute('data-group-id', group.id);
  
  const header = document.createElement('div');
  header.className = 'group-header';
  if (group.color) header.classList.add(group.color);
  
  const collapseIndicator = document.createElement('span');
  collapseIndicator.className = 'collapse-indicator';
  collapseIndicator.textContent = '▼';
  
  const groupTitle = document.createElement('span');
  groupTitle.className = 'group-title';
  groupTitle.textContent = group.title || 'Unnamed Group';
  
  const groupCount = document.createElement('span');
  groupCount.className = 'group-count';
  groupCount.textContent = `${tabs.length} tabs`;
  
  const groupActions = document.createElement('div');
  groupActions.className = 'group-actions';
  
  const ungroupButton = document.createElement('button');
  ungroupButton.className = 'group-close';
  ungroupButton.title = 'Ungroup tabs';
  ungroupButton.textContent = '×';
  
  groupActions.appendChild(ungroupButton);
  
  header.appendChild(collapseIndicator);
  header.appendChild(groupTitle);
  header.appendChild(groupCount);
  header.appendChild(groupActions);
  
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  
  tabs.forEach(tab => {
    const tabElement = createTabElement(tab);
    tabsContainer.appendChild(tabElement);
  });
  
  groupElement.appendChild(header);
  groupElement.appendChild(tabsContainer);
  
  // Add event listener for ungroup button
  ungroupButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await chrome.tabGroups.ungroup(group.id);
      await refreshTabsList();
    } catch (error) {
      showStatus('Error ungrouping tabs: ' + error.message, 'error');
    }
  });
  
  // Add event listener for collapse/expand
  header.addEventListener('click', () => {
    groupElement.classList.toggle('collapsed');
    collapseIndicator.textContent = groupElement.classList.contains('collapsed') ? '▶' : '▼';
    
    // Save collapsed state
    chrome.storage.local.get(['collapsedGroups'], (result) => {
      const collapsedGroups = result.collapsedGroups || {};
      collapsedGroups[group.id] = groupElement.classList.contains('collapsed');
      chrome.storage.local.set({ collapsedGroups });
    });
  });
  
  return groupElement;
}

function createTabElement(tab) {
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.setAttribute('data-tab-id', tab.id);
  
  const favicon = document.createElement('img');
  favicon.className = 'tab-icon';
  favicon.src = tab.favIconUrl || chrome.runtime.getURL('images/default-favicon.png');
  favicon.addEventListener('error', () => {
    favicon.src = chrome.runtime.getURL('images/default-favicon.png');
  });
  
  const tabInfo = document.createElement('div');
  tabInfo.className = 'tab-info';
  
  const tabTitle = document.createElement('div');
  tabTitle.className = 'tab-title';
  tabTitle.textContent = tab.title;
  
  const tabUrl = document.createElement('div');
  tabUrl.className = 'tab-url';
  tabUrl.textContent = tab.url;
  
  const tabActions = document.createElement('div');
  tabActions.className = 'tab-actions';
  
  const closeButton = document.createElement('button');
  closeButton.className = 'tab-close';
  closeButton.title = 'Close tab';
  closeButton.textContent = '×';
  
  tabInfo.appendChild(tabTitle);
  tabInfo.appendChild(tabUrl);
  tabActions.appendChild(closeButton);
  
  tabElement.appendChild(favicon);
  tabElement.appendChild(tabInfo);
  tabElement.appendChild(tabActions);
  
  // Add event listener for tab click
  tabElement.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-close')) {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });
  
  // Add event listener for close button
  closeButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await chrome.tabs.remove(tab.id);
      tabElement.remove();
    } catch (error) {
      showStatus('Error closing tab: ' + error.message, 'error');
    }
  });
  
  return tabElement;
}

export async function refreshTabsList() {
  await displayTabs();
}

async function getDomainCategory(domain, tabs) {
  // First check user-configured groups
  const settings = await chrome.storage.local.get(['customGroups']);
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

export async function groupTabsByDomain() {
  try {
    const tabs = await chrome.tabs.query({});
    
    // Group tabs by domain
    const domainGroups = new Map();
    
    tabs.forEach(tab => {
      const url = new URL(tab.url);
      const domain = url.hostname;
      
      if (!domainGroups.has(domain)) {
        domainGroups.set(domain, []);
      }
      domainGroups.get(domain).push(tab);
    });
    
    // Create tab groups
    for (const [domain, domainTabs] of domainGroups) {
      if (domainTabs.length > 1) {
        const tabIds = domainTabs.map(tab => tab.id);
        const group = await chrome.tabGroups.group({ tabIds });
        
        // Get category for the group
        const category = await getDomainCategory(domain, domainTabs);
        
        // Update group with title and color
        await chrome.tabGroups.update(group, { 
          title: category.title,
          color: category.color,
          collapsed: false
        });
      }
    }
    
    await refreshTabsList();
  } catch (error) {
    showStatus('Error grouping tabs: ' + error.message, 'error');
  }
}

export async function ungroupAllTabs() {
  try {
    const tabs = await chrome.tabs.query({});
    const groupedTabs = tabs.filter(tab => tab.groupId !== -1);
    
    for (const tab of groupedTabs) {
      await chrome.tabs.ungroup(tab.id);
    }
    
    await refreshTabsList();
  } catch (error) {
    showStatus('Error ungrouping tabs: ' + error.message, 'error');
  }
}

export async function groupTabsByAI() {
  try {
    const settings = await chrome.storage.local.get(['apiKey', 'apiUrl', 'customGroups']);
    if (!settings.apiKey) {
      throw new Error('API key not configured');
    }

    const tabs = await chrome.tabs.query({});
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
      const tabInfo = unmatchedTabs.map(tab => ({
        title: tab.title,
        url: tab.url
      }));

      const response = await fetch(settings.apiUrl || 'https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.apiKey}`
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
      const categories = JSON.parse(data.choices[0].message.content);

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

    await refreshTabsList();
  } catch (error) {
    showStatus('Error grouping tabs by AI: ' + error.message, 'error');
  }
}
