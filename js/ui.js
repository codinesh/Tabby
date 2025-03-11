// UI related functions
export function showAiSettings() {
  const settingsPanel = document.getElementById("settings-panel");
  settingsPanel.classList.remove("hidden");
}

export function hideAiSettings() {
  const settingsPanel = document.getElementById("settings-panel");
  settingsPanel.classList.add("hidden");
}

export function toggleSettings() {
  const settingsPanel = document.getElementById("settings-panel");
  settingsPanel.classList.toggle("hidden");
}

export function toggleGroupingButtons(activeBtn) {
  const buttons = document.querySelectorAll(".grouping-btn");
  buttons.forEach((btn) => btn.classList.remove("active"));
  activeBtn.classList.add("active");
}

// Context menu functionality
export function toggleContextMenu() {
  const contextMenu = document.getElementById("context-menu");
  
  if (contextMenu.classList.contains("hidden")) {
    contextMenu.classList.remove("hidden");
    
    // Add a one-time click handler to close the menu
    setTimeout(() => {
      document.addEventListener("click", (e) => {
        const menuButton = document.getElementById("menu-button");
        if (!contextMenu.contains(e.target) && e.target !== menuButton) {
          contextMenu.classList.add("hidden");
        }
      }, { once: true });
    }, 0);
  } else {
    contextMenu.classList.add("hidden");
  }
}

export function closeContextMenuOnClickOutside(event) {
  const contextMenu = document.getElementById("context-menu");
  const menuButton = document.getElementById("menu-button");
  
  if (!contextMenu.contains(event.target) && event.target !== menuButton) {
    contextMenu.classList.add("hidden");
  }
}

// Theme management
export function initializeTheme() {
  chrome.storage.sync.get(["theme"], (result) => {
    const theme = result.theme || "light";
    document.body.classList.toggle("dark-theme", theme === "dark");
    updateThemeIcon();
  });
}

export function updateThemeIcon() {
  const isDark = document.body.classList.contains("dark-theme");
  document.getElementById("theme-toggle").textContent = isDark ? "🌞" : "🌙";
}

export function toggleTheme() {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  chrome.storage.sync.set({ theme: isDark ? "dark" : "light" });
  updateThemeIcon();
}

// Tab search functionality
export function initializeSearch() {
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", debounce(filterTabs, 300));
}

export function filterTabs() {
  const searchInput = document.getElementById("search-input");
  const query = searchInput.value.toLowerCase();
  const tabElements = document.querySelectorAll(".tab");

  tabElements.forEach((tabElement) => {
    const title = tabElement.querySelector(".tab-title").textContent.toLowerCase();
    const url = tabElement.querySelector(".tab-url").textContent.toLowerCase();
    const matches = title.includes(query) || url.includes(query);
    tabElement.style.display = matches ? "" : "none";
  });

  // Update group visibility based on visible tabs
  const groups = document.querySelectorAll(".tab-group");
  groups.forEach((group) => {
    const visibleTabs = group.querySelectorAll(".tab[style='']").length;
    group.style.display = visibleTabs > 0 ? "" : "none";
  });
}

// Debounce helper function
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

// Group collapse functionality
export function toggleGroupCollapse(group) {
  if (!group) return;
  
  const wasCollapsed = group.classList.contains("collapsed");
  const tabsContainer = group.querySelector(".tabs-container");
  const indicator = group.querySelector(".collapse-indicator");
  
  // Update the collapse indicator
  if (indicator) {
    indicator.textContent = wasCollapsed ? "▼" : "▶";
  }
  
  // Toggle the collapsed class
  group.classList.toggle("collapsed");
  
  // Store collapsed state
  const groupId = group.getAttribute("data-group-id");
  if (groupId) {
    chrome.storage.local.get(["collapsedGroups"], (result) => {
      const collapsedGroups = result.collapsedGroups || {};
      collapsedGroups[groupId] = !wasCollapsed;
      chrome.storage.local.set({ collapsedGroups });
    });
  }
}

// Initialize group collapse
export function initializeGroupCollapse() {
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
}
