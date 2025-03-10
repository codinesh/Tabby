// Status message handling functions
function showStatus(message, type = 'info', autoHide = true) {
  const statusContainer = document.getElementById('status-container');
  const statusMessage = document.getElementById('status-message');
  const loadingSpinner = document.getElementById('loading-spinner');
  
  // Clear previous status classes
  statusContainer.classList.remove('success', 'error', 'info');
  
  // Set the message and type
  statusMessage.textContent = message;
  statusContainer.classList.add(type);
  statusContainer.classList.remove('hidden');
  
  // Hide spinner when showing a regular status message
  loadingSpinner.style.display = 'none';
  
  // Auto-hide the status after 3 seconds if autoHide is true
  if (autoHide) {
    setTimeout(() => {
      hideStatus();
    }, 3000);
  }
}

function hideStatus() {
  const statusContainer = document.getElementById('status-container');
  statusContainer.classList.add('hidden');
}

function showLoading(message = 'Processing...') {
  const statusContainer = document.getElementById('status-container');
  const statusMessage = document.getElementById('status-message');
  const loadingSpinner = document.getElementById('loading-spinner');
  
  // Set the message
  statusMessage.textContent = message;
  
  // Show container and spinner
  statusContainer.classList.remove('hidden');
  statusContainer.classList.remove('success', 'error');
  statusContainer.classList.add('info');
  
  // Always display the spinner for loading
  loadingSpinner.style.display = 'inline-block';
}

function hideLoading() {
  const loadingSpinner = document.getElementById('loading-spinner');
  loadingSpinner.style.display = 'none';
}

// Store settings in Chrome storage
function saveSettings() {
  // Show loading status while saving
  showLoading('Saving settings...');
  
  const aiUrl = document.getElementById('ai-url').value;
  const apiKey = document.getElementById('api-key').value;
  
  // Save custom groups
  const customGroups = getCustomGroupsFromUI();

  chrome.storage.sync.set({
    aiUrl: aiUrl,
    apiKey: apiKey,
    customGroups: customGroups
  }, () => {
    // Hide settings panel
    hideAiSettings();
    
    // Show success status message
    showStatus('Settings saved!', 'success');
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

// Function to display all tabs organized by groups
function displayTabs() {
  const tabsList = document.getElementById('tabs-list');
  tabsList.innerHTML = '';
  
  // Get all tabs and group information
  chrome.tabs.query({}, (tabs) => {
    // Organize tabs by groups
    const groupedTabs = {};
    const ungroupedTabs = [];
    
    // First pass: identify all groups and their properties
    tabs.forEach((tab) => {
      if (tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE) {
        if (!groupedTabs[tab.groupId]) {
          groupedTabs[tab.groupId] = {
            id: tab.groupId,
            tabs: [],
            title: null,
            color: null
          };
        }
        groupedTabs[tab.groupId].tabs.push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    });
    
    // Get group details (title, color)
    const groupIds = Object.keys(groupedTabs);
    if (groupIds.length > 0) {
      const getGroupDetails = (groupId) => {
        chrome.tabGroups.get(parseInt(groupId), (group) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            return;
          }
          
          groupedTabs[groupId].title = group.title;
          groupedTabs[groupId].color = group.color;
          
          // Render the group after getting details
          renderTabGroup(groupedTabs[groupId]);
        });
      };
      
      // Get details for each group
      groupIds.forEach(getGroupDetails);
    }
    
    // Render ungrouped tabs
    ungroupedTabs.forEach((tab) => {
      renderTab(tab, null);
    });
  });
  
  // Function to render a tab group
  function renderTabGroup(group) {
    const groupContainer = document.createElement('div');
    groupContainer.className = 'tab-group';
    groupContainer.setAttribute('data-group-id', group.id);
    
    // Group header
    const groupHeader = document.createElement('div');
    groupHeader.className = `group-header ${group.color || 'grey'}`;
    
    const groupTitle = document.createElement('div');
    groupTitle.className = 'group-title';
    groupTitle.textContent = group.title || 'Unnamed group';
    
    // Add actions container for group controls
    const groupActions = document.createElement('div');
    groupActions.className = 'group-actions';
    
    // Add edit button for renaming the group
    const editBtn = document.createElement('div');
    editBtn.className = 'group-edit';
    editBtn.title = 'Edit group name';
    editBtn.innerHTML = '✎';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Hide the group title and create an edit field
      groupTitle.style.display = 'none';
      
      const editField = document.createElement('input');
      editField.type = 'text';
      editField.className = 'group-edit-field';
      editField.value = group.title || '';
      editField.placeholder = 'Group name';
      
      // Insert before the actions container
      groupHeader.insertBefore(editField, groupActions);
      
      // Focus on the field
      editField.focus();
      
      // Save changes on enter or blur
      const saveChanges = () => {
        const newTitle = editField.value.trim();
        
        if (newTitle) {
          // Check if another group with the same name already exists (ignoring case)
          chrome.tabs.query({}, (tabs) => {
            const tabIds = group.tabs.map(tab => tab.id);
            let existingGroupFound = false;
            
            // Filter to find tabs in groups
            const tabsInGroups = tabs.filter(tab => tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE);
            
            // Find unique group IDs
            const uniqueGroupIds = [...new Set(tabsInGroups.map(tab => tab.groupId))];
            
            // Check each group to see if its name matches our new name
            const checkGroups = (index) => {
              if (index >= uniqueGroupIds.length) {
                // No matching group found, update current group
                chrome.tabGroups.update(parseInt(group.id), { title: newTitle }, () => {
                  groupTitle.textContent = newTitle;
                });
                return;
              }
              
              const currentGroupId = uniqueGroupIds[index];
              
              // Skip our own group
              if (currentGroupId === group.id) {
                checkGroups(index + 1);
                return;
              }
              
              chrome.tabGroups.get(currentGroupId, (currentGroup) => {
                if (chrome.runtime.lastError) {
                  checkGroups(index + 1);
                  return;
                }
                
                // If we found a group with matching name (case-insensitive)
                if (currentGroup.title && currentGroup.title.toLowerCase() === newTitle.toLowerCase()) {
                  // We found a matching group, move tabs to it
                  existingGroupFound = true;
                  
                  // Move the tabs to the existing group
                  chrome.tabs.group({ tabIds: tabIds, groupId: currentGroupId }, () => {
                    // Remove the old (now empty) group from UI
                    groupContainer.remove();
                    
                    // Show status message
                    showStatus(`Moved tabs to existing "${currentGroup.title}" group`, 'success');
                    
                    // Refresh the display
                    displayTabs();
                  });
                } else {
                  // Continue checking other groups
                  checkGroups(index + 1);
                }
              });
            };
            
            // Start checking groups
            checkGroups(0);
            
            // If no existing group was found, the callback will update the title
          });
        } else {
          // If empty name, revert to previous name
          groupTitle.textContent = group.title || 'Unnamed group';
        }
        
        // Remove edit field and show title
        editField.remove();
        groupTitle.style.display = '';
      };
      
      editField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          saveChanges();
        } else if (e.key === 'Escape') {
          editField.remove();
          groupTitle.style.display = '';
        }
      });
      
      editField.addEventListener('blur', saveChanges);
    });
    
    // Add to settings button - saves this category to custom groups
    const addToSettingsBtn = document.createElement('div');
    addToSettingsBtn.className = 'group-add-to-settings';
    addToSettingsBtn.title = 'Add to custom groups';
    addToSettingsBtn.innerHTML = '+';
    addToSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      // Get the current custom groups
      chrome.storage.sync.get(['customGroups'], (result) => {
        const customGroups = result.customGroups || [];
        
        // Check if this group name already exists in settings
        const groupExists = customGroups.some(g => g.name.toLowerCase() === (group.title || '').toLowerCase());
        
        if (!groupExists && group.title) {
          // Collect keywords from the tab titles and URLs in this group
          const keywords = [];
          group.tabs.forEach(tab => {
            // Extract domain name as a keyword
            try {
              const url = new URL(tab.url);
              const domain = url.hostname;
              if (domain && !keywords.includes(domain)) {
                keywords.push(domain);
              }
            } catch (e) {
              // Skip invalid URLs
            }
            
            // Extract words from title that are at least 4 chars as potential keywords
            const titleWords = tab.title.split(/\s+/)
              .filter(word => word.length >= 4)
              .map(word => word.toLowerCase());
              
            // Add unique words to keywords
            titleWords.forEach(word => {
              if (!keywords.includes(word)) {
                keywords.push(word);
              }
            });
          });
          
          // Limit keywords to first 5 to avoid clutter
          const limitedKeywords = keywords.slice(0, 5);
          
          // Add to custom groups
          customGroups.push({
            name: group.title,
            keywords: limitedKeywords
          });
          
          // Save updated custom groups
          chrome.storage.sync.set({ customGroups }, () => {
            showStatus(`Added "${group.title}" to custom groups`, 'success');
          });
        } else if (groupExists) {
          showStatus(`"${group.title}" already exists in custom groups`, 'info');
        } else {
          showStatus('Cannot add unnamed group to settings', 'error');
        }
      });
    });
    
    // Add close button
    const groupCloseBtn = document.createElement('div');
    groupCloseBtn.className = 'group-close';
    groupCloseBtn.textContent = '✕';
    groupCloseBtn.title = 'Close group';
    groupCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Close all tabs in this group
      const tabIds = group.tabs.map(tab => tab.id);
      chrome.tabs.remove(tabIds);
      groupContainer.remove();
    });
    
    // Add all action buttons
    groupActions.appendChild(editBtn);
    groupActions.appendChild(addToSettingsBtn);
    groupActions.appendChild(groupCloseBtn);
    
    // Assemble the header
    groupHeader.appendChild(groupTitle);
    groupHeader.appendChild(groupActions);
    groupContainer.appendChild(groupHeader);
    
    // Add tabs within this group
    group.tabs.forEach((tab) => {
      renderTab(tab, groupContainer);
    });
    
    // Check if only one tab is in the group and add a special indicator
    if (group.tabs.length === 1) {
      const singleTabIndicator = document.createElement('div');
      singleTabIndicator.className = 'single-tab-indicator';
      singleTabIndicator.textContent = 'Single tab in group - consider ungrouping';
      singleTabIndicator.addEventListener('click', () => {
        // Ungroup the single tab
        chrome.tabs.ungroup(group.tabs[0].id, () => {
          showStatus('Tab ungrouped', 'success');
          displayTabs();
        });
      });
      groupContainer.appendChild(singleTabIndicator);
    }
    
    tabsList.appendChild(groupContainer);
  }
  
  // Function to render a single tab
  function renderTab(tab, container) {
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
    closeBtn.title = 'Close tab';
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
    
    // Add to the appropriate container
    if (container) {
      container.appendChild(tabItem);
    } else {
      tabsList.appendChild(tabItem);
    }
  }
}

// Group tabs by domain
function groupTabsByDomain() {
  showLoading('Grouping tabs by domain...');
  
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
    
    showStatus('Tabs grouped by domain!', 'success');
  });
}

// Ungroup all tabs
function ungroupAllTabs() {
  showLoading('Ungrouping all tabs...');
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      if (tab.groupId !== chrome.tabs.TAB_GROUP_ID_NONE) {
        chrome.tabs.ungroup(tab.id);
      }
    });
    
    showStatus('All tabs ungrouped!', 'success');
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
      showStatus('Please configure AI settings first', 'error');
      showAiSettings();
      return;
    }
    
    // Show loading status
    showLoading('Categorizing tabs with AI...');
    
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
        // Update loading message
        showLoading('Sending data to AI service...');
        
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

                          1. Analyze Tab Content: Examine both the URL and the title of each browser tab to understand its content and purpose.
                          2. Generate Concise Categories: Create short, impactful category names (ideally 1-3 words).
                          3. Prioritize Generality: Group similar tabs under broader, more general categories. Avoid creating excessively specific categories that could be grouped under a common theme. For example, instead of separate categories like 'Azure Function Deployment' and 'Azure Function Monitoring', use a more general category like 'Azure Functions'.
                          4. Use Clear Language: Ensure that the category names are clear and easily understandable to users. Avoid technical jargon or overly complex terms.
                          5. Maintain Consistency: Use consistent naming conventions and formats for similar categories. For example, if you use 'Project Management' for one category, avoid using 'Project Mngmt' for another.
                          6. Avoid Redundancy: Do not create multiple categories that essentially cover the same topic with slight variations in wording. Aim for a set of distinct and non-overlapping categories.
                          7. Provide JSON Output: Format the output as a JSON object where keys are tab IDs and values are the generated categories.
                      `
            },
            {
              role: "user",
              content: `Please categorize the following tabs into specific and diverse categories:\n${tabsInfoText}`
            }
          ]
        };

        try {
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
          
          showLoading('Processing AI response...');
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
              
              showLoading('Applying tab categories...');
              showStatus('Tabs categorized successfully!', 'success', false);
            } catch (parseError) {
              console.error('Error parsing AI response:', parseError);
              showStatus(`Error parsing AI response: ${parseError.message}`, 'error');
            }
          }
        } catch (fetchError) {
          console.error('Error fetching from AI service:', fetchError);
          showStatus(`Error connecting to AI service: ${fetchError.message}`, 'error');
          return;
        }
      } else {
        // If all tabs were matched with custom groups, no need for API call
        showLoading('Applying custom group categories...');
        showStatus('Tabs categorized using custom groups!', 'success');
      }
      
      // Save all categories to storage
      chrome.storage.local.set({ tabCategories }, () => {
        // Group by categories
        showLoading('Creating tab groups...');
        groupTabsByCategory(tabCategories);
        // Refresh display to show categories
        displayTabs();
      });
    } catch (error) {
      console.error('Error categorizing tabs:', error);
      showStatus(`Error categorizing tabs: ${error.message}`, 'error');
    }
  });
}

// Group tabs by category
function groupTabsByCategory(categories) {
  // Organize tabs by category
  const categoryGroups = {};
  const colorOptions = ['grey', 'blue', 'red', 'yellow', 'green', 'pink', 'purple', 'cyan'];
  
  for (const tabId in categories) {
    const category = categories[tabId];
    if (!categoryGroups[category]) {
      categoryGroups[category] = [];
    }
    categoryGroups[category].push(parseInt(tabId));
  }
  
  // Count for tracking when all groups are processed
  let groupsCount = Object.keys(categoryGroups).length;
  let processedCount = 0;
  
  // If no groups to process, show completed message immediately
  if (groupsCount === 0) {
    showStatus('Tab categorization completed!', 'success');
    return;
  }
  
  // Create tab groups by category
  for (const category in categoryGroups) {
    const tabIds = categoryGroups[category];
    if (tabIds.length > 0) {
      chrome.tabs.group({ tabIds }, (groupId) => {
        // Generate color based on category name hash
        // This ensures consistent colors for the same category names
        const hash = Array.from(category).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colorIndex = hash % colorOptions.length;
        const color = colorOptions[colorIndex];
        
        chrome.tabGroups.update(groupId, { 
          title: category,
          color: color
        }, () => {
          // Increment processed count and check if all groups are processed
          processedCount++;
          if (processedCount >= groupsCount) {
            // All groups processed, show success message
            showStatus('Tab grouping completed!', 'success');
          }
        });
      });
    } else {
      // Increment processed count for empty groups
      processedCount++;
      if (processedCount >= groupsCount) {
        // All groups processed, show success message
        showStatus('Tab grouping completed!', 'success');
      }
    }
  }
}

// Show AI settings panel
function showAiSettings() {
  // Hide controls and tabs list
  document.querySelector('.controls').classList.add('hidden');
  document.getElementById('tabs-list').classList.add('hidden');
  
  // Show settings panel
  document.getElementById('ai-settings').classList.remove('hidden');
}

// Hide AI settings panel
function hideAiSettings() {
  // Hide settings panel
  document.getElementById('ai-settings').classList.add('hidden');
  
  // Show controls and tabs list
  document.querySelector('.controls').classList.remove('hidden');
  document.getElementById('tabs-list').classList.remove('hidden');
}

// Toggle settings visibility
function toggleSettings() {
  const settingsPanel = document.getElementById('ai-settings');
  if (settingsPanel.classList.contains('hidden')) {
    // Show settings, hide controls and tabs
    showAiSettings();
  } else {
    // Hide settings, show controls and tabs
    hideAiSettings();
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
        showStatus('API key required for AI categorization', 'info');
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