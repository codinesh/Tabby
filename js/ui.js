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

export function toggleContextMenu() {
  const contextMenu = document.getElementById("context-menu");
  contextMenu.classList.toggle("hidden");
}

export function closeContextMenuOnClickOutside(event) {
  const contextMenu = document.getElementById("context-menu");
  if (!contextMenu.contains(event.target) && !event.target.matches("#menu-button")) {
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
export function initializeGroupCollapse() {
  document.addEventListener("click", (e) => {
    if (e.target.closest(".group-header")) {
      const group = e.target.closest(".tab-group");
      toggleGroupCollapse(group);
    }
  });
}

export function toggleGroupCollapse(group) {
  const isCollapsed = group.classList.toggle("collapsed");
  const groupId = group.getAttribute("data-group-id");

  // Store collapsed state
  chrome.storage.local.get(["collapsedGroups"], (result) => {
    const collapsedGroups = result.collapsedGroups || {};
    collapsedGroups[groupId] = isCollapsed;
    chrome.storage.local.set({ collapsedGroups });
  });
}
