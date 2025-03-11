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
      header.innerHTML = `
        <span class="collapse-indicator">▼</span>
        <span class="group-title">Ungrouped Tabs</span>
        <span class="group-count">${ungroupedTabs.length} tabs</span>
      `;
      
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
  
  header.innerHTML = `
    <span class="collapse-indicator">▼</span>
    <span class="group-title">${group.title || 'Unnamed Group'}</span>
    <span class="group-count">${tabs.length} tabs</span>
    <div class="group-actions">
      <button class="group-close" title="Ungroup tabs">×</button>
    </div>
  `;
  
  const tabsContainer = document.createElement('div');
  tabsContainer.className = 'tabs-container';
  
  tabs.forEach(tab => {
    const tabElement = createTabElement(tab);
    tabsContainer.appendChild(tabElement);
  });
  
  groupElement.appendChild(header);
  groupElement.appendChild(tabsContainer);
  
  // Add event listener for ungroup button
  const ungroupButton = header.querySelector('.group-close');
  ungroupButton.addEventListener('click', async (e) => {
    e.stopPropagation();
    try {
      await chrome.tabGroups.ungroup(group.id);
      await refreshTabsList();
    } catch (error) {
      showStatus('Error ungrouping tabs: ' + error.message, 'error');
    }
  });
  
  return groupElement;
}

function createTabElement(tab) {
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.setAttribute('data-tab-id', tab.id);
  
  const favicon = tab.favIconUrl || 'icon.png';
  
  tabElement.innerHTML = `
    <img class="tab-icon" src="${favicon}" onerror="this.src='icon.png'">
    <div class="tab-info">
      <div class="tab-title">${tab.title}</div>
      <div class="tab-url">${tab.url}</div>
    </div>
    <div class="tab-actions">
      <button class="tab-close" title="Close tab">×</button>
    </div>
  `;
  
  // Add event listener for tab click
  tabElement.addEventListener('click', (e) => {
    if (!e.target.classList.contains('tab-close')) {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });
  
  // Add event listener for close button
  const closeButton = tabElement.querySelector('.tab-close');
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
        await chrome.tabs.group({ tabIds });
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
  const settings = await chrome.storage.local.get(['apiKey', 'aiUrl']);
  if (!settings.apiKey) {
    throw new Error('API key not configured');
  }

  try {
    const tabs = await chrome.tabs.query({});
    const tabTitles = tabs.map(tab => ({ id: tab.id, title: tab.title }));

    const response = await fetch(settings.aiUrl || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "system",
          content: "You are a helpful assistant that groups browser tabs into meaningful categories."
        }, {
          role: "user",
          content: `Group these tabs into 3-5 meaningful categories. Return only JSON in this format: {"groups":[{"name":"category name","tabIds":[tab ids]}]}. Here are the tabs: ${JSON.stringify(tabTitles)}`
        }]
      })
    });

    if (!response.ok) {
      throw new Error('API request failed');
    }

    const data = await response.json();
    const groups = JSON.parse(data.choices[0].message.content).groups;

    // Create tab groups
    for (const group of groups) {
      if (group.tabIds.length > 0) {
        const groupId = await chrome.tabs.group({ tabIds: group.tabIds });
        await chrome.tabGroups.update(groupId, { title: group.name });
      }
    }

    await refreshTabsList();
  } catch (error) {
    throw new Error('Failed to group tabs using AI: ' + error.message);
  }
}
