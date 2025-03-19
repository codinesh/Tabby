import { TabManager } from "./js/core/tabs.js";
import { SettingsManager } from "./js/core/settings.js";
import { TabRenderer } from "./js/ui/tab-renderer.js";
import { SettingsUI } from "./js/ui/settings-ui.js";
import { ThemeManager } from "./js/ui/theme-manager.js";
import { MenuManager } from "./js/ui/menu-manager.js";
import { StatusManager } from "./js/ui/status-manager.js";
import { ICONS } from "./js/ui/icons.js";

// Initialize core managers
const settingsManager = new SettingsManager();
const tabManager = new TabManager(settingsManager);

// Initialize UI components
const tabRenderer = new TabRenderer(tabManager, settingsManager);
const settingsUI = new SettingsUI(settingsManager);
const themeManager = new ThemeManager(settingsManager);
const menuManager = new MenuManager();
const statusManager = new StatusManager();

// Function to initialize icons
function initializeIcons() {
  document.getElementById("search-icon").innerHTML = ICONS.SEARCH;
  document.getElementById("menu-icon").innerHTML = ICONS.MENU;
  document.getElementById("collapse-icon").innerHTML = ICONS.CHEVRON;
  document.getElementById("expand-icon").innerHTML = ICONS.CHEVRON;
  document.getElementById("refresh-icon").innerHTML = ICONS.REFRESH;
  document.getElementById("settings-icon").innerHTML = ICONS.SETTINGS;

  // Initialize theme icons
  const themeIcon = document.getElementById("theme-icon");
  // Clear any existing content
  themeIcon.innerHTML = "";

  // Create dark theme icon
  const darkIcon = document.createElement("div");
  darkIcon.className = "theme-icon-dark";
  darkIcon.innerHTML = ICONS.THEME_DARK;

  // Create light theme icon
  const lightIcon = document.createElement("div");
  lightIcon.className = "theme-icon-light";
  lightIcon.innerHTML = ICONS.THEME_LIGHT;

  themeIcon.appendChild(darkIcon);
  themeIcon.appendChild(lightIcon);
}

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
    // Initialize icons first
    initializeIcons();

    // Initialize theme before showing status
    await themeManager.initialize();

    statusManager.showLoading("Loading tabs...");

    // Sync saved tab group collapsed states with browser
    await tabManager.syncSavedCollapsedStates();

    // Load and display tabs
    await tabRenderer.renderTabs();

    // Load settings
    await settingsUI.loadSettings();

    // Initialize all event listeners
    initializeEventListeners();

    statusManager.showStatus("Extension loaded successfully");
  } catch (error) {
    console.error("Error initializing extension:", error);
    statusManager.showStatus("Error loading extension: " + error.message, true);
  }
});

function initializeEventListeners() {
  // Theme toggle
  document.getElementById("theme-toggle").addEventListener("click", () => {
    themeManager.toggle();
  });

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
      statusManager.showLoading("Grouping tabs by domain...");
      await tabManager.groupTabsByDomain();
      await tabRenderer.renderTabs();
      statusManager.showStatus("Tabs grouped by domain successfully");
    } catch (error) {
      console.error("Error grouping by domain:", error);
      statusManager.showStatus(
        "Error grouping by domain: " + error.message,
        true
      );
    }
  });

  // Group by AI button
  const groupByAIBtn = document.getElementById("group-by-ai");
  groupByAIBtn.addEventListener("click", async () => {
    try {
      statusManager.showLoading("Grouping tabs using AI...");
      await tabManager.groupTabsByAI();
      await tabRenderer.renderTabs();
      statusManager.showStatus("Tabs grouped by AI successfully");
    } catch (error) {
      if (error.message === "API key not configured") {
        settingsUI.show();
        statusManager.showStatus("Please configure API key in settings", true);
      } else {
        statusManager.showStatus(
          "Error grouping by AI: " + error.message,
          true
        );
      }
      console.error("Error grouping by AI:", error);
    }
  });

  // Ungroup all button
  document
    .getElementById("ungroup-tabs")
    .addEventListener("click", async () => {
      try {
        statusManager.showLoading("Ungrouping all tabs...");
        await tabManager.ungroupAllTabs();
        await tabRenderer.renderTabs();
        statusManager.showStatus("All tabs ungrouped successfully");
      } catch (error) {
        console.error("Error ungrouping tabs:", error);
        statusManager.showStatus(
          "Error ungrouping tabs: " + error.message,
          true
        );
      }
    });

  // Collapse all tab groups
  document.querySelectorAll("#collapse-tabs").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        statusManager.showLoading("Collapsing all tab groups...");
        menuManager.closeContextMenu();

        // Collapse browser tab groups and get updated state
        const result = await tabManager.collapseAllTabGroups();

        if (result) {
          // Update UI directly without full re-render
          updateGroupCollapseState(true);
        } else {
          // Fallback to full re-render
          await tabRenderer.renderTabs();
        }

        statusManager.showStatus("All tab groups collapsed");
      } catch (error) {
        console.error("Error collapsing tab groups:", error);
        statusManager.showStatus(
          "Error collapsing tab groups: " + error.message,
          true
        );
      }
    });
  });

  // Expand all tab groups
  document.querySelectorAll("#expand-tabs").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        statusManager.showLoading("Expanding all tab groups...");
        menuManager.closeContextMenu();

        // Expand browser tab groups and get updated state
        const result = await tabManager.expandAllTabGroups();

        if (result) {
          // Update UI directly without full re-render
          updateGroupCollapseState(false);
        } else {
          // Fallback to full re-render
          await tabRenderer.renderTabs();
        }

        statusManager.showStatus("All tab groups expanded");
      } catch (error) {
        console.error("Error expanding tab groups:", error);
        statusManager.showStatus(
          "Error expanding tab groups: " + error.message,
          true
        );
      }
    });
  });

  // Settings related buttons
  document.getElementById("menu-settings").addEventListener("click", () => {
    menuManager.closeContextMenu();
    settingsUI.show();
  });

  document
    .getElementById("save-settings")
    .addEventListener("click", async () => {
      try {
        statusManager.showLoading("Saving settings...");
        await settingsUI.saveSettings();
        settingsUI.hide();
        await tabRenderer.renderTabs();
        statusManager.showStatus("Settings saved successfully");
      } catch (error) {
        console.error("Error saving settings:", error);
        statusManager.showStatus(
          "Error saving settings: " + error.message,
          true
        );
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

  // Refresh tabs button
  document
    .getElementById("menu-refresh-tabs")
    .addEventListener("click", async () => {
      try {
        statusManager.showLoading("Refreshing tabs...");
        await tabRenderer.renderTabs();
        menuManager.closeContextMenu();
        statusManager.showStatus("Tabs refreshed successfully");
      } catch (error) {
        console.error("Error refreshing tabs:", error);
        statusManager.showStatus(
          "Error refreshing tabs: " + error.message,
          true
        );
      }
    });
}

// Function to update UI group collapse states without re-rendering everything
function updateGroupCollapseState(isCollapsed) {
  document.querySelectorAll(".tab-group").forEach((groupElement) => {
    // Update class
    if (isCollapsed) {
      groupElement.classList.add("collapsed");
    } else {
      groupElement.classList.remove("collapsed");
    }

    // Update the collapse indicator SVG
    const indicator = groupElement.querySelector(".collapse-indicator");
    if (indicator) {
      indicator.innerHTML = ICONS.CHEVRON;
      indicator.style.transform = isCollapsed
        ? "rotate(0deg)"
        : "rotate(90deg)";
      indicator.setAttribute(
        "aria-label",
        isCollapsed ? "Expand group" : "Collapse group"
      );
    }
  });
}
