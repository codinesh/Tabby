// Store settings in Chrome storage
function saveSettings() {
  const aiUrl = document.getElementById('ai-url').value;
  const apiKey = document.getElementById('api-key').value;
  
  // Save custom groups
  const customGroups = getCustomGroupsFromUI();

  chrome.storage.sync.set({
    aiUrl: aiUrl,
    apiKey: apiKey,
    customGroups: customGroups
  }, () => {
    alert('Settings saved!');
    hideAiSettings(); // Hide settings after saving
  });
}

// Function to get custom groups from UI
function getCustomGroupsFromUI() {
  const customGroups = [];
  const groupElements = document.querySelectorAll('.custom-group');
  
  groupElements.forEach((element) => {
    const nameInput = element.querySelector('.group-name');
    const keywordsInput = element.querySelector('.group-keywords');
    
    if (nameInput.value.trim() !== '') {
      const keywords = keywordsInput.value.split(',')
        .map(k => k.trim().toLowerCase())
        .filter(k => k !== '');
      
      customGroups.push({
        name: nameInput.value.trim(),
        keywords: keywords
      });
    }
  });
  
  return customGroups;
}

// Load settings from Chrome storage
function loadSettings() {
  chrome.storage.sync.get(['aiUrl', 'apiKey', 'customGroups'], (result) => {
    if (result.aiUrl) {
      document.getElementById('ai-url').value = result.aiUrl;
    } else {
      // Set default API URL if not already set
      document.getElementById('ai-url').value = 'https://api.openai.com/v1/chat/completions';
    }
    
    if (result.apiKey) {
      document.getElementById('api-key').value = result.apiKey;
    }
    
    // Load custom groups
    if (result.customGroups && result.customGroups.length > 0) {
      loadCustomGroupsToUI(result.customGroups);
    } else {
      // Add one empty group by default
      addCustomGroup();
    }
    
    // Initialize settings tabs
    initSettingsTabs();
    
    // Check if we need to show settings automatically
    checkIfSettingsNeeded();
  });
}

// Load custom groups into the UI
function loadCustomGroupsToUI(groups) {
  const container = document.getElementById('custom-groups-container');
  container.innerHTML = '';
  
  groups.forEach(group => {
    const element = addCustomGroup();
    const nameInput = element.querySelector('.group-name');
    const keywordsInput = element.querySelector('.group-keywords');
    
    nameInput.value = group.name;
    keywordsInput.value = group.keywords.join(', ');
  });
  
  // Add at least one group if none were loaded
  if (groups.length === 0) {
    addCustomGroup();
  }
}

// Add a new custom group element to the UI
function addCustomGroup() {
  const container = document.getElementById('custom-groups-container');
  const template = document.getElementById('custom-group-template');
  const clone = document.importNode(template.content, true);
  const groupElement = clone.querySelector('.custom-group');
  
  // Add event listeners for the remove button
  const removeButton = clone.querySelector('.remove-group');
  removeButton.addEventListener('click', function() {
    groupElement.remove();
  });
  
  container.appendChild(clone);
  return groupElement;
}

// Initialize settings tabs
function initSettingsTabs() {
  const tabs = document.querySelectorAll('.settings-tab');
  const contents = document.querySelectorAll('.settings-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and hide all contents
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.add('hidden'));
      
      // Add active class to clicked tab and show corresponding content
      tab.classList.add('active');
      const contentId = tab.getAttribute('data-tab');
      document.getElementById(contentId).classList.remove('hidden');
    });
  });
}

// Function to check if settings panel needs to be shown
function checkIfSettingsNeeded() {
  chrome.storage.sync.get(['apiKey'], (result) => {
    if (!result.apiKey) {
      // If no API key is set, we'll need to show settings when AI grouping is selected
      const groupByAiBtn = document.getElementById('group-by-ai');
      groupByAiBtn.addEventListener('click', showAiSettings, { once: true });
    }
  });
}

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
      
      // Add category span if we have it stored
      chrome.storage.local.get(['tabCategories'], (result) => {
        if (result.tabCategories && result.tabCategories[tab.id]) {
          const category = document.createElement('span');
          category.className = 'category';
          category.textContent = `[${result.tabCategories[tab.id]}]`;
          title.appendChild(category);
        }
      });
      
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

// Ungroup all tabs
function ungroupAllTabs() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE) {
        chrome.tabs.ungroup(tab.id);
      }
    });
  });
}

// Apply user-defined group if tab matches any keywords
function matchCustomGroup(tabInfo, customGroups) {
  // Check title and URL against custom group keywords
  const title = tabInfo.title.toLowerCase();
  const url = tabInfo.url.toLowerCase();
  
  for (const group of customGroups) {
    for (const keyword of group.keywords) {
      if (title.includes(keyword) || url.includes(keyword)) {
        return group.name;
      }
    }
  }
  
  return null;
}

// Categorize tabs using AI
async function categorizeTabs() {
  // Get settings
  chrome.storage.sync.get(['aiUrl', 'apiKey', 'customGroups'], async (settings) => {
    if (!settings.aiUrl || !settings.apiKey) {
      alert('Please configure AI settings first');
      showAiSettings();
      return;
    }
    
    const tabCategories = {};
    let allTabsInfo = [];
    const customGroups = settings.customGroups || [];

    try {
      // Get all tabs
      const tabs = await new Promise(resolve => 
        chrome.tabs.query({}, resolve)
      );
      
      // Prepare data for batch processing
      allTabsInfo = tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url
      }));
      
      // First check for matches with user-defined groups
      const tabsToProcess = [];
      
      for (const tab of allTabsInfo) {
        // Check if tab matches any custom group
        const customGroupMatch = matchCustomGroup(tab, customGroups);
        
        if (customGroupMatch) {
          tabCategories[tab.id] = customGroupMatch;
        } else {
          // If no match, this tab needs AI categorization
          tabsToProcess.push(tab);
        }
      }
      
      // If there are tabs that don't match custom groups, categorize them with AI
      if (tabsToProcess.length > 0) {
        // Create content for the OpenAI API request
        const tabsInfoText = tabsToProcess.map(tab => 
          `Tab ID: ${tab.id}, Title: ${tab.title}, URL: ${tab.url}`
        ).join('\n');
        
        // Format the request body for OpenAI's API with improved prompt
        const requestBody = {
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a browser tab categorization assistant. Your goal is to group open browser tabs into meaningful and concise categories based on their URL and title. Prioritize creating generic yet descriptive categories that group similar tabs together under broader topics, instead of creating highly specific or redundant categories.

                          Instructions:

                          1. Analyze Tab Content: Examine both the URL (especially the domain) and the title of each browser tab to understand its content and purpose.
                          2. Generate Concise Categories: Create short, impactful category names (ideally 1-3 words).
                          3. Prioritize Generality: Group similar tabs under broader, more general categories. Avoid creating excessively specific categories that could be grouped under a common theme. For example, instead of separate categories like 'Azure Function Deployment' and 'Azure Function Monitoring', use a more general category like 'Azure Functions'.
                          4. Consider Domain (but avoid domain-specific categories unless appropriate): Use the domain (e.g., 'azure.com', 'github.com', 'youtube.com') as a hint for context, but categories should generally reflect the topic or function of the tab, not just the website domain itself. For example, tabs on 'github.com' might be categorized as 'Code Repositories', 'Project Development', etc., not just 'GitHub'. However, for very distinct domains like 'youtube.com', 'YouTube' might be a suitable concise category.
                          5. Avoid Redundancy: Do not create multiple categories that essentially cover the same topic with slight variations in wording. Aim for a set of distinct and non-overlapping categories.

                          Output Format: Return ONLY a JSON object where keys are tab IDs and values are the generated concise categories. Do not include any introductory or explanatory text outside of the JSON object.
                      `
            },
            {
              role: "user",
              content: `Please categorize the following tabs into specific and diverse categories:\n${tabsInfoText}`
            }
          ]
        };

        // Send request to OpenAI API
        const response = await fetch(settings.aiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': `${settings.apiKey}`
          },
          body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
          throw new Error(`AI service returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process OpenAI's response
        if (data.choices && data.choices.length > 0) {
          const assistantMessage = data.choices[0].message.content;
          
          try {
            // Extract JSON from the response
            let jsonStr = assistantMessage;
            
            // If the response contains markdown code blocks, extract the JSON
            if (jsonStr.includes('```json')) {
              jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
            } else if (jsonStr.includes('```')) {
              jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
            }
            
            // Parse the categories
            const aiCategories = JSON.parse(jsonStr);
            
            // Merge AI categories with custom group matches
            for (const tabId in aiCategories) {
              tabCategories[tabId] = aiCategories[tabId];
            }
          } catch (parseError) {
            console.error('Error parsing AI response:', parseError);
            alert(`Error parsing AI response: ${parseError.message}`);
          }
        }
      }
      
      // Save all categories to storage
      chrome.storage.local.set({ tabCategories }, () => {
        // Group by categories
        groupTabsByCategory(tabCategories);
        // Refresh display to show categories
        displayTabs();
      });
    } catch (error) {
      console.error('Error categorizing tabs:', error);
      alert(`Error categorizing tabs: ${error.message}`);
    }
  });
}

// Group tabs by category
function groupTabsByCategory(categories) {
  // Organize tabs by category
  const categoryGroups = {};
  
  for (const tabId in categories) {
    const category = categories[tabId];
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(parseInt(tabId));
  }
  
  // Create tab groups by category
  for (const category in categoryGroups) {
    const tabIds = categoryGroups[category];
    if (tabIds.length > 0) {
      chrome.tabs.group({ tabIds }, (groupId) => {
        // Generate color based on category name hash
        // This ensures consistent colors for the same category names
        const colorOptions = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
        const hash = Array.from(category).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colorIndex = hash % colorOptions.length;
        const color = colorOptions[colorIndex];
        
        chrome.tabGroups.update(groupId, { 
          title: category,
          color: color
        });
      });
    }
  }
}

// Show AI settings panel
function showAiSettings() {
  document.getElementById('ai-settings').classList.remove('hidden');
}

// Hide AI settings panel
function hideAiSettings() {
  document.getElementById('ai-settings').classList.add('hidden');
}

// Toggle settings visibility
function toggleSettings() {
  const settingsPanel = document.getElementById('ai-settings');
  if (settingsPanel.classList.contains('hidden')) {
    settingsPanel.classList.remove('hidden');
  } else {
    settingsPanel.classList.add('hidden');
  }
}

// Toggle between domain and AI grouping buttons
function toggleGroupingButtons(activeBtn) {
  document.getElementById('group-tabs').classList.remove('active');
  document.getElementById('group-by-ai').classList.remove('active');
  document.getElementById('ungroup-tabs').classList.remove('active');
  activeBtn.classList.add('active');
}

// Function to toggle the context menu
function toggleContextMenu() {
  const menu = document.getElementById('context-menu');
  menu.classList.toggle('hidden');
  
  // Close menu when clicking outside
  if (!menu.classList.contains('hidden')) {
    document.addEventListener('click', closeContextMenuOnClickOutside);
  }
}

// Function to close the context menu when clicking outside
function closeContextMenuOnClickOutside(event) {
  const menu = document.getElementById('context-menu');
  const menuButton = document.getElementById('menu-button');
  
  if (!menu.contains(event.target) && event.target !== menuButton) {
    menu.classList.add('hidden');
    document.removeEventListener('click', closeContextMenuOnClickOutside);
  }
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
  // Display all tabs
  displayTabs();
  
  // Load saved settings
  loadSettings();
  
  // Set up menu button
  document.getElementById('menu-button').addEventListener('click', (event) => {
    toggleContextMenu();
    event.stopPropagation();
  });
  
  // Set up menu items
  document.getElementById('menu-refresh').addEventListener('click', () => {
    displayTabs();
    toggleContextMenu();
  });
  
  document.getElementById('menu-settings').addEventListener('click', () => {
    toggleSettings();
    toggleContextMenu();
  });
  
  // Add event listener for the group tabs button
  const groupTabsBtn = document.getElementById('group-tabs');
  groupTabsBtn.addEventListener('click', () => {
    toggleGroupingButtons(groupTabsBtn);
    groupTabsByDomain();
    hideAiSettings();
  });
  
  // Add event listener for the group by AI button
  const groupByAiBtn = document.getElementById('group-by-ai');
  groupByAiBtn.addEventListener('click', () => {
    toggleGroupingButtons(groupByAiBtn);
    
    // Check if API key is available before performing AI grouping
    chrome.storage.sync.get(['apiKey'], (result) => {
      if (result.apiKey) {
        // API key exists, proceed with categorization
        categorizeTabs();
      } else {
        // No API key, show settings
        showAiSettings();
      }
    });
  });

  // Add event listener for the ungroup tabs button
  const ungroupTabsBtn = document.getElementById('ungroup-tabs');
  ungroupTabsBtn.addEventListener('click', () => {
    toggleGroupingButtons(ungroupTabsBtn);
    ungroupAllTabs();
    hideAiSettings();
  });
  
  // Add event listener for the save settings button
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  
  // Add event listener for the add group button
  document.getElementById('add-group').addEventListener('click', addCustomGroup);
});

// Listen for tab events and refresh the list
chrome.tabs.onCreated.addListener(displayTabs);
chrome.tabs.onRemoved.addListener(displayTabs);
chrome.tabs.onUpdated.addListener(displayTabs);