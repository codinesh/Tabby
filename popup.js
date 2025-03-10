// Store settings in Chrome storage
function saveSettings() {
  const aiUrl = document.getElementById('ai-url').value;
  const apiKey = document.getElementById('api-key').value;

  chrome.storage.sync.set({
    aiUrl: aiUrl,
    apiKey: apiKey
  }, () => {
    alert('Settings saved!');
    hideAiSettings(); // Hide settings after saving
  });
}

// Load settings from Chrome storage
function loadSettings() {
  chrome.storage.sync.get(['aiUrl', 'apiKey'], (result) => {
    if (result.aiUrl) {
      document.getElementById('ai-url').value = result.aiUrl;
    } else {
      // Set default API URL if not already set
      document.getElementById('ai-url').value = 'https://api.openai.com/v1/chat/completions';
    }
    
    if (result.apiKey) {
      document.getElementById('api-key').value = result.apiKey;
    }
    
    // Check if we need to show settings automatically
    // (only if API key is not set and user clicks Group by AI)
    checkIfSettingsNeeded();
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

// Categorize tabs using AI
async function categorizeTabs() {
  // Get settings
  chrome.storage.sync.get(['aiUrl', 'apiKey'], async (settings) => {
    if (!settings.aiUrl || !settings.apiKey) {
      alert('Please configure AI settings first');
      showAiSettings();
      return;
    }
    
    const tabCategories = {};
    let allTabsInfo = [];

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

      // Create content for the OpenAI API request
      const tabsInfoText = allTabsInfo.map(tab => 
        `Tab ID: ${tab.id}, Title: ${tab.title}, URL: ${tab.url}`
      ).join('\n');
      
      // Format the request body for OpenAI's API
      const requestBody = {
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a tab categorization assistant. Categorize each tab into one of these categories: Workitems, Documentation, Code, Learning, Entertainment, or Others. Return ONLY a JSON object with tab IDs as keys and categories as values, with no additional text."
          },
          {
            role: "user",
            content: `Please categorize the following tabs:\n${tabsInfoText}`
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
          const categoriesData = JSON.parse(jsonStr);
          
          // Store categories
          for (const tabId in categoriesData) {
            tabCategories[tabId] = categoriesData[tabId];
          }
          
          // Save categories to storage
          chrome.storage.local.set({ tabCategories }, () => {
            // Group by categories
            groupTabsByCategory(tabCategories);
            // Refresh display to show categories
            displayTabs();
          });
        } catch (parseError) {
          console.error('Error parsing AI response:', parseError);
          alert(`Error parsing AI response: ${parseError.message}`);
        }
      } else {
        throw new Error('Invalid response format from AI service');
      }
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
        // Set color based on category type
        let color = 'blue'; // Default
        
        if (category.toLowerCase().includes('work')) {
          color = 'red';
        } else if (category.toLowerCase().includes('documentation')) {
          color = 'yellow';
        } else if (category.toLowerCase().includes('code')) {
          color = 'green';
        } else if (category.toLowerCase().includes('learning')) {
          color = 'purple';
        } else if (category.toLowerCase().includes('entertainment')) {
          color = 'pink';
        }
        
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

// Initialize the extension
document.addEventListener('DOMContentLoaded', () => {
  // Display all tabs
  displayTabs();
  
  // Load saved settings
  loadSettings();
  
  // Add event listener for the refresh button
  document.getElementById('refresh').addEventListener('click', displayTabs);
  
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
  
  // Add event listener for the settings toggle button
  document.getElementById('settings-toggle').addEventListener('click', toggleSettings);
  
  // Add event listener for the save settings button
  document.getElementById('save-settings').addEventListener('click', () => {
    saveSettings();
    categorizeTabs();
  });
});

// Listen for tab events and refresh the list
chrome.tabs.onCreated.addListener(displayTabs);
chrome.tabs.onRemoved.addListener(displayTabs);
chrome.tabs.onUpdated.addListener(displayTabs);