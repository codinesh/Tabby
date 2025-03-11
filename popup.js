import { TabManager } from "./js/core/tabs.js";
import { SettingsManager } from "./js/core/settings.js";
import { TabRenderer } from "./js/ui/tab-renderer.js";
import { SettingsUI } from "./js/ui/settings-ui.js";

// Initialize core managers
const tabManager = new TabManager();
const settingsManager = new SettingsManager();

// Initialize UI components
const tabRenderer = new TabRenderer(tabManager);
const settingsUI = new SettingsUI(settingsManager);

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

    // Initialize theme
    initializeTheme();

    // Initialize all event listeners
    initializeEventListeners();
  } catch (error) {
    console.error("Error initializing extension:", error);
  }
});

function initializeEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.addEventListener("click", toggleTheme);

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
  menuButton.addEventListener("click", toggleContextMenu);

  // Close context menu when clicking outside
  document.addEventListener("click", (e) => {
    const contextMenu = document.getElementById("context-menu");
    if (!contextMenu.contains(e.target) && e.target !== menuButton) {
      contextMenu.classList.add("hidden");
    }
  });

  // Refresh tabs button
  document
    .getElementById("menu-refresh-tabs")
    .addEventListener("click", async () => {
      await tabRenderer.renderTabs();
      toggleContextMenu();
    });
}

// Theme related functions
function initializeTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const theme = localStorage.getItem("theme") || "system";
  applyTheme(theme);

  // Listen for system theme changes
  prefersDark.addEventListener("change", () => {
    if (localStorage.getItem("theme") === "system") {
      applyTheme("system");
    }
  });
}

function applyTheme(theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  if (theme === "system") {
    document.documentElement.setAttribute(
      "data-theme",
      prefersDark.matches ? "dark" : "light"
    );
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }

  // Update theme options
  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.classList.toggle("active", btn.id === `theme-${theme}`);
  });

  // Update theme toggle button
  const themeToggle = document.getElementById("theme-toggle");
  themeToggle.textContent =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "☀️"
      : "🌙";
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  localStorage.setItem("theme", newTheme);
  applyTheme(newTheme);
}

function toggleContextMenu() {
  const contextMenu = document.getElementById("context-menu");
  contextMenu.classList.toggle("hidden");
}
