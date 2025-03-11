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
document.addEventListener("DOMContentLoaded", async () => {
  // Display all tabs
  await displayTabs();

  // Load saved settings
  loadSettings();

  // Initialize theme
  initializeTheme();

  // Initialize search
  initializeSearch();

  // Initialize group collapse
  initializeGroupCollapse();

  // Set up menu button with proper event handling
  const menuButton = document.getElementById("menu-button");
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleContextMenu();
  });

  // Close context menu when clicking outside
  document.addEventListener("click", closeContextMenuOnClickOutside);

  // Set up menu items with proper event handling
  document.getElementById("menu-settings").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleSettings();
    toggleContextMenu();
  });

  // Add event listener for refresh tabs menu item
  document.getElementById("menu-refresh-tabs").addEventListener("click", (event) => {
    event.stopPropagation();
    refreshTabsList();
    toggleContextMenu();
  });

  // Add event listener for the group tabs button
  const groupTabsBtn = document.getElementById("group-tabs");
  groupTabsBtn.addEventListener("click", async () => {
    toggleGroupingButtons(groupTabsBtn);
    await groupTabsByDomain();
    hideAiSettings();
  });

  // Add event listener for the group by AI button
  const groupByAiBtn = document.getElementById("group-by-ai");
  groupByAiBtn.addEventListener("click", () => {
    toggleGroupingButtons(groupByAiBtn);
    showAiSettings();
  });

  // Add event listener for ungroup all button
  document.getElementById("ungroup-tabs").addEventListener("click", async (event) => {
    event.stopPropagation();
    await ungroupAllTabs();
    toggleContextMenu();
  });

  // Add event listener for save settings button
  document.getElementById("save-settings").addEventListener("click", saveSettings);

  // Add event listener for add group button
  document.getElementById("add-group").addEventListener("click", addCustomGroup);

  // Add event listener for theme toggle
  document.getElementById("theme-toggle").addEventListener("click", toggleTheme);
});
