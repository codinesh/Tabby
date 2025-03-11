// UI components for settings
export class SettingsUI {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.settingsContent = document.getElementById("settings-content");
    this.mainContent = document.getElementById("main-content");
  }

  show() {
    this.mainContent.classList.add("hidden");
    this.settingsContent.classList.remove("hidden");
    // Initialize settings tabs when showing settings
    this.initializeSettingsTabs();
  }

  hide() {
    this.mainContent.classList.remove("hidden");
    this.settingsContent.classList.add("hidden");
  }

  createCustomGroupElement() {
    const template = document.getElementById("custom-group-template");
    const clone = document.importNode(template.content, true);
    const groupElement = clone.querySelector(".custom-group");

    const removeButton = clone.querySelector(".remove-group");
    removeButton.addEventListener("click", () => groupElement.remove());

    return groupElement;
  }

  getCustomGroupsFromUI() {
    const groups = [];
    const groupElements = document.querySelectorAll(".custom-group");

    groupElements.forEach((element) => {
      const nameInput = element.querySelector(".group-name");
      const keywordsInput = element.querySelector(".group-keywords");
      const colorSelect = element.querySelector(".group-color");

      const name = nameInput.value.trim();
      const keywords = keywordsInput.value.trim();
      const color = colorSelect ? colorSelect.value : "grey";

      if (name && keywords) {
        groups.push({
          name,
          keywords,
          color,
        });
      }
    });

    return groups;
  }

  async loadCustomGroupsToUI(groups = []) {
    const container = document.getElementById("custom-groups-container");
    container.innerHTML = "";

    groups.forEach((group) => {
      const element = this.createCustomGroupElement();
      const nameInput = element.querySelector(".group-name");
      const keywordsInput = element.querySelector(".group-keywords");
      const colorSelect = element.querySelector(".group-color");

      nameInput.value = group.name || "";
      // Handle both string and array formats for keywords
      keywordsInput.value = Array.isArray(group.keywords)
        ? group.keywords.join(", ")
        : group.keywords || "";
      if (colorSelect && group.color) {
        colorSelect.value = group.color;
      }

      container.appendChild(element);
    });

    // Add one empty group if none exist
    if (groups.length === 0) {
      container.appendChild(this.createCustomGroupElement());
    }
  }

  async saveSettings() {
    const apiUrl = document.getElementById("ai-url").value.trim();
    const apiKey = document.getElementById("api-key").value.trim();
    const customGroups = this.getCustomGroupsFromUI();

    await this.settingsManager.saveSettings({
      apiUrl,
      apiKey,
      customGroups,
    });
  }

  async loadSettings() {
    const settings = await this.settingsManager.loadSettings();

    document.getElementById("ai-url").value = settings.apiUrl || "";
    document.getElementById("api-key").value = settings.apiKey || "";

    await this.loadCustomGroupsToUI(settings.customGroups);
    this.initializeSettingsTabs();
  }

  initializeSettingsTabs() {
    const tabs = document.querySelectorAll(".settings-tab");
    const contents = document.querySelectorAll(".settings-content");

    // First hide all content sections
    contents.forEach((content) => content.classList.add("hidden"));
    tabs.forEach((tab) => tab.classList.remove("active"));

    // Show the first tab by default
    const firstTab = tabs[0];
    if (firstTab) {
      firstTab.classList.add("active");
      const contentId = firstTab.getAttribute("data-tab");
      const content = document.getElementById(contentId);
      if (content) {
        content.classList.remove("hidden");
      }
    }

    // Add click handlers
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        contents.forEach((c) => c.classList.add("hidden"));

        tab.classList.add("active");
        const contentId = tab.getAttribute("data-tab");
        const content = document.getElementById(contentId);
        if (content) {
          content.classList.remove("hidden");
        }
      });
    });
  }
}
