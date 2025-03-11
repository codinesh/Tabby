import { TabManager } from "./js/core/tabs.js";
import { SettingsManager } from "./js/core/settings.js";
import { TabRenderer } from "./js/ui/tab-renderer.js";
import { SettingsUI } from "./js/ui/settings-ui.js";
import { ThemeManager } from "./js/ui/theme-manager.js";
import { MenuManager } from "./js/ui/menu-manager.js";

// Initialize core managers
const tabManager = new TabManager();
const settingsManager = new SettingsManager();

// Initialize UI components
const tabRenderer = new TabRenderer(tabManager, settingsManager);
const settingsUI = new SettingsUI(settingsManager);
const themeManager = new ThemeManager(settingsManager);
const menuManager = new MenuManager();

// Helper function for debouncing
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Initialize the extension
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Load and display tabs
    await tabRenderer.renderTabs();

    // Load settings
    await settingsUI.loadSettings();

    // Initialize theme and menu
    themeManager.initialize();
    
    // Initialize all event listeners
    initializeEventListeners();
  } catch (error) {
    console.error("Error initializing extension:", error);
  }
});

function initializeEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", () => themeManager.toggle());

  // Search functionality
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener(
    "input",
    debounce((e) => {
      tabRenderer.filterTabs(e.target.value);
    }, 300)
  );

  // Group by domain button
  const groupByDomainBtn = document.getElementById("group-by-domain");
  groupByDomainBtn.addEventListener("click", async () => {
    try {
      await tabManager.groupTabsByDomain();
      await tabRenderer.renderTabs();
    } catch (error) {
      console.error("Error grouping by domain:", error);
    }
  });

  // Group by AI button
  const groupByAIBtn = document.getElementById("group-by-ai");
  groupByAIBtn.addEventListener("click", async () => {
    try {
      await tabManager.groupTabsByAI();
      await tabRenderer.renderTabs();
    } catch (error) {
      if (error.message === "API key not found") {
        settingsUI.show();
      }
      console.error("Error grouping by AI:", error);
    }
  });

  // Ungroup all button
  document
    .getElementById("ungroup-tabs")
    .addEventListener("click", async () => {
      try {
        await tabManager.ungroupAllTabs();
        await tabRenderer.renderTabs();
      } catch (error) {
        console.error("Error ungrouping tabs:", error);
      }
    });

  // Settings related buttons
  document.getElementById("menu-settings").addEventListener("click", () => {
    settingsUI.show();
  });

  document
    .getElementById("save-settings")
    .addEventListener("click", async () => {
      try {
        await settingsUI.saveSettings();
        settingsUI.hide();
        await tabRenderer.renderTabs();
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    });

  document.getElementById("cancel-settings").addEventListener("click", () => {
    settingsUI.hide();
  });

  // Add custom group button
  document.getElementById("add-group").addEventListener("click", () => {
    const element = settingsUI.createCustomGroupElement();
    document.getElementById("custom-groups-container").appendChild(element);
  });

  // Menu button
  const menuButton = document.getElementById("menu-button");
  menuButton.addEventListener("click", () => menuManager.toggleContextMenu());

  // Refresh tabs button
  document
    .getElementById("menu-refresh-tabs")
    .addEventListener("click", async () => {
      await tabRenderer.renderTabs();
      menuManager.toggleContextMenu();
    });
}
