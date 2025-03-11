import { showStatus, showLoading, hideLoading } from "./js/status.js";
import { saveSettings, loadSettings, addCustomGroup } from "./js/settings.js";
import {
  displayTabs,
  groupTabsByDomain,
  ungroupAllTabs,
  groupTabsByAI,
} from "./js/tabs.js";

// Initialize the extension
document.addEventListener("DOMContentLoaded", async () => {
  // Display all tabs
  try {
    showLoading("Loading tabs...");
    await displayTabs();
  } finally {
    hideLoading();
  }

  // Load saved settings
  await loadSettings();

  // Initialize theme
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  const theme = localStorage.getItem("theme") || "system";

  function applyTheme(theme) {
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

  // Initialize theme
  applyTheme(theme);

  // Theme toggle button click handler
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  });

  // Theme option buttons click handlers
  document.querySelectorAll(".theme-option").forEach((btn) => {
    btn.addEventListener("click", () => {
      const theme = btn.id.replace("theme-", "");
      localStorage.setItem("theme", theme);
      applyTheme(theme);
    });
  });

  // Listen for system theme changes
  prefersDark.addEventListener("change", (e) => {
    if (localStorage.getItem("theme") === "system") {
      applyTheme("system");
    }
  });

  // Initialize search
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener(
    "input",
    debounce((e) => {
      const query = e.target.value.toLowerCase();
      const tabs = document.querySelectorAll(".tab");

      tabs.forEach((tab) => {
        const title = tab.querySelector(".tab-title").textContent.toLowerCase();
        const url = tab.querySelector(".tab-url").textContent.toLowerCase();

        if (title.includes(query) || url.includes(query)) {
          tab.style.display = "";
        } else {
          tab.style.display = "none";
        }
      });
    }, 300)
  );

  // Initialize group collapse
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".group-header");
    if (header && !e.target.closest(".group-close")) {
      e.stopPropagation();
      const group = header.closest(".tab-group");
      if (group) {
        toggleGroupCollapse(group);
      }
    }
  });

  // Set up menu button
  const menuButton = document.getElementById("menu-button");
  menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    showSettings();
    toggleContextMenu();
  });

  // Close context menu when clicking outside
  document.addEventListener("click", (e) => {
    const contextMenu = document.getElementById("context-menu");
    const menuButton = document.getElementById("menu-button");

    if (!contextMenu.contains(e.target) && e.target !== menuButton) {
      contextMenu.classList.add("hidden");
    }
  });

  // Set up menu items
  document.getElementById("menu-settings").addEventListener("click", () => {
    document.getElementById("main-content").classList.add("hidden");
    document.getElementById("settings-content").classList.remove("hidden");
    toggleContextMenu();
  });

  document.getElementById("menu-refresh-tabs").addEventListener("click", () => {
    displayTabs();
    toggleContextMenu();
  });

  // Group tabs button
  const groupTabsBtn = document.getElementById("group-by-domain");
  groupTabsBtn.addEventListener("click", async () => {
    try {
      showLoading("Grouping tabs by domain...");
      await groupTabsByDomain();
    } finally {
      hideLoading();
    }
  });

  // Ungroup all button
  document
    .getElementById("ungroup-tabs")
    .addEventListener("click", async () => {
      await ungroupAllTabs();
      toggleContextMenu();
    });

  // Settings tabs
  const settingsTabs = document.querySelectorAll(".settings-tab");
  const settingsContents = document.querySelectorAll(".settings-content");

  settingsTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      settingsTabs.forEach((t) => t.classList.remove("active"));
      settingsContents.forEach((c) => c.classList.add("hidden"));

      tab.classList.add("active");
      const contentId = tab.getAttribute("data-tab");
      document.getElementById(contentId).classList.remove("hidden");
    });
  });

  // Save settings button
  document
    .getElementById("save-settings")
    .addEventListener("click", async () => {
      try {
        showLoading("Saving settings...");
        await saveSettings();
        hideSettings();
        showStatus("Settings saved successfully", "success");
      } catch (error) {
        showStatus("Failed to save settings", "error");
      } finally {
        hideLoading();
      }
    });

  // Cancel settings button
  document
    .getElementById("cancel-settings")
    .addEventListener("click", hideSettings);

  // Add group button
  document
    .getElementById("add-group")
    .addEventListener("click", addCustomGroup);
});

// Helper functions
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

function toggleContextMenu() {
  const contextMenu = document.getElementById("context-menu");
  contextMenu.classList.toggle("hidden");
}

function showSettings(tab = "groups-settings") {
  document.getElementById("main-content").classList.add("hidden");
  document.getElementById("settings-content").classList.remove("hidden");

  // Activate the specified tab
  document
    .querySelectorAll(".settings-tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".settings-content")
    .forEach((c) => c.classList.add("hidden"));

  document.querySelector(`[data-tab="${tab}"]`).classList.add("active");
  document.getElementById(tab).classList.remove("hidden");
}

function hideSettings() {
  document.getElementById("settings-content").classList.add("hidden");
  document.getElementById("main-content").classList.remove("hidden");
}

function toggleGroupCollapse(group) {
  if (!group) return;

  const wasCollapsed = group.classList.contains("collapsed");
  const indicator = group.querySelector(".collapse-indicator");

  if (indicator) {
    indicator.textContent = wasCollapsed ? "▼" : "▶";
  }

  group.classList.toggle("collapsed");

  const groupId = group.getAttribute("data-group-id");
  if (groupId) {
    chrome.storage.local.get(["collapsedGroups"], (result) => {
      const collapsedGroups = result.collapsedGroups || {};
      collapsedGroups[groupId] = !wasCollapsed;
      chrome.storage.local.set({ collapsedGroups });
    });
  }
}
