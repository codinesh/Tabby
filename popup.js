import { showStatus, showLoading } from './js/status.js';
import { saveSettings, loadSettings, addCustomGroup } from './js/settings.js';
import { displayTabs, refreshTabsList, groupTabsByDomain, ungroupAllTabs } from './js/tabs.js';
import { 
  showAiSettings, 
  hideAiSettings, 
  toggleSettings, 
  toggleGroupingButtons,
  toggleContextMenu,
  closeContextMenuOnClickOutside,
  initializeTheme,
  toggleTheme,
  initializeSearch,
  initializeGroupCollapse
} from './js/ui.js';

// Initialize the extension
document.addEventListener("DOMContentLoaded", () => {
  // Display all tabs
  displayTabs();

  // Load saved settings
  loadSettings();

  // Initialize theme
  initializeTheme();

  // Initialize search
  initializeSearch();

  // Initialize group collapse
  initializeGroupCollapse();

  // Set up menu button
  document.getElementById("menu-button").addEventListener("click", (event) => {
    toggleContextMenu();
    event.stopPropagation();
  });

  // Close context menu when clicking outside
  document.addEventListener("click", closeContextMenuOnClickOutside);

  // Set up menu items
  document.getElementById("menu-settings").addEventListener("click", () => {
    toggleSettings();
    toggleContextMenu();
  });

  // Add event listener for refresh tabs menu item
  document.getElementById("menu-refresh-tabs").addEventListener("click", () => {
    refreshTabsList();
    toggleContextMenu();
  });

  // Add event listener for the group tabs button
  const groupTabsBtn = document.getElementById("group-tabs");
  groupTabsBtn.addEventListener("click", () => {
    toggleGroupingButtons(groupTabsBtn);
    groupTabsByDomain();
    hideAiSettings();
  });

  // Add event listener for the group by AI button
  const groupByAiBtn = document.getElementById("group-by-ai");
  groupByAiBtn.addEventListener("click", () => {
    toggleGroupingButtons(groupByAiBtn);
    showAiSettings();
  });

  // Add event listener for ungroup all button
  document.getElementById("ungroup-tabs").addEventListener("click", () => {
    ungroupAllTabs();
    toggleContextMenu();
  });

  // Add event listener for save settings button
  document.getElementById("save-settings").addEventListener("click", saveSettings);

  // Add event listener for add group button
  document.getElementById("add-group").addEventListener("click", addCustomGroup);

  // Add event listener for theme toggle
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
});
