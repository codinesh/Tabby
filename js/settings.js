import { showLoading, showStatus } from "./status.js";
import { hideAiSettings, showAiSettings } from "./ui.js";

// Store settings in Chrome storage
export function saveSettings() {
  // Show loading status while saving
  showLoading("Saving settings...");

  const aiUrl = document.getElementById("ai-url").value;
  const apiKey = document.getElementById("api-key").value;

  // Save custom groups
  const customGroups = getCustomGroupsFromUI();

  chrome.storage.sync.set(
    {
      aiUrl: aiUrl,
      apiKey: apiKey,
      customGroups: customGroups,
    },
    () => {
      // Hide settings panel
      hideAiSettings();

      // Show success status message
      showStatus("Settings saved!", "success");
    }
  );
}

// Function to get custom groups from UI
function getCustomGroupsFromUI() {
  const customGroups = [];
  const groupElements = document.querySelectorAll(".custom-group");

  groupElements.forEach((element) => {
    const nameInput = element.querySelector(".group-name");
    const keywordsInput = element.querySelector(".group-keywords");

    if (nameInput.value.trim() !== "") {
      const keywords = keywordsInput.value
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k !== "");

      customGroups.push({
        name: nameInput.value.trim(),
        keywords: keywords,
      });
    }
  });

  return customGroups;
}

// Load settings from Chrome storage
export function loadSettings() {
  chrome.storage.sync.get(["aiUrl", "apiKey", "customGroups"], (result) => {
    if (result.aiUrl) {
      document.getElementById("ai-url").value = result.aiUrl;
    } else {
      // Set default API URL if not already set
      document.getElementById("ai-url").value =
        "https://api.openai.com/v1/chat/completions";
    }

    if (result.apiKey) {
      document.getElementById("api-key").value = result.apiKey;
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
  const container = document.getElementById("custom-groups-container");
  container.innerHTML = "";

  groups.forEach((group) => {
    const element = addCustomGroup();
    const nameInput = element.querySelector(".group-name");
    const keywordsInput = element.querySelector(".group-keywords");

    nameInput.value = group.name;
    keywordsInput.value = group.keywords.join(", ");
  });

  // Add at least one group if none were loaded
  if (groups.length === 0) {
    addCustomGroup();
  }
}

// Add a new custom group element to the UI
export function addCustomGroup() {
  const container = document.getElementById("custom-groups-container");
  const template = document.getElementById("custom-group-template");
  const clone = document.importNode(template.content, true);
  const groupElement = clone.querySelector(".custom-group");

  // Add event listeners for the remove button
  const removeButton = clone.querySelector(".remove-group");
  removeButton.addEventListener("click", function () {
    groupElement.remove();
  });

  container.appendChild(clone);
  return groupElement;
}

// Initialize settings tabs
function initSettingsTabs() {
  const tabs = document.querySelectorAll(".settings-tab");
  const contents = document.querySelectorAll(".settings-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and hide all contents
      tabs.forEach((t) => t.classList.remove("active"));
      contents.forEach((c) => c.classList.add("hidden"));

      // Add active class to clicked tab and show corresponding content
      tab.classList.add("active");
      const contentId = tab.getAttribute("data-tab");
      document.getElementById(contentId).classList.remove("hidden");
    });
  });
}

// Function to check if settings panel needs to be shown
function checkIfSettingsNeeded() {
  chrome.storage.sync.get(["apiKey"], (result) => {
    if (!result.apiKey) {
      // If no API key is set, we'll need to show settings when AI grouping is selected
      const groupByAiBtn = document.getElementById("group-by-ai");
      groupByAiBtn.addEventListener("click", showAiSettings, { once: true });
    }
  });
}
