// UI components for settings
export class SettingsUI {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.settingsContent = document.getElementById('settings-content');
    this.mainContent = document.getElementById('main-content');
  }

  show() {
    this.mainContent.classList.add('hidden');
    this.settingsContent.classList.remove('hidden');
  }

  hide() {
    this.mainContent.classList.add('hidden');
    this.settingsContent.classList.remove('hidden');
  }

  createCustomGroupElement() {
    const template = document.getElementById('custom-group-template');
    const clone = document.importNode(template.content, true);
    const groupElement = clone.querySelector('.custom-group');

    const removeButton = clone.querySelector('.remove-group');
    removeButton.addEventListener('click', () => groupElement.remove());

    return groupElement;
  }

  getCustomGroupsFromUI() {
    const groups = [];
    const groupElements = document.querySelectorAll('.custom-group');

    groupElements.forEach(element => {
      const nameInput = element.querySelector('.group-name');
      const keywordsInput = element.querySelector('.group-keywords');

      if (nameInput.value.trim()) {
        const keywords = keywordsInput.value
          .split(',')
          .map(k => k.trim().toLowerCase())
          .filter(k => k !== '');

        groups.push({
          name: nameInput.value.trim(),
          keywords
        });
      }
    });

    return groups;
  }

  async loadCustomGroupsToUI(groups) {
    const container = document.getElementById('custom-groups-container');
    container.innerHTML = '';

    groups.forEach(group => {
      const element = this.createCustomGroupElement();
      const nameInput = element.querySelector('.group-name');
      const keywordsInput = element.querySelector('.group-keywords');

      nameInput.value = group.name;
      keywordsInput.value = group.keywords.join(', ');
      container.appendChild(element);
    });

    // Add one empty group if none exist
    if (groups.length === 0) {
      container.appendChild(this.createCustomGroupElement());
    }
  }

  async saveSettings() {
    const aiUrl = document.getElementById('ai-url').value;
    const apiKey = document.getElementById('api-key').value;
    const customGroups = this.getCustomGroupsFromUI();

    await this.settingsManager.saveSettings({
      aiUrl,
      apiKey,
      customGroups
    });
  }

  async loadSettings() {
    const settings = await this.settingsManager.loadSettings();
    
    document.getElementById('ai-url').value = settings.aiUrl;
    document.getElementById('api-key').value = settings.apiKey;
    
    await this.loadCustomGroupsToUI(settings.customGroups);
  }

  initializeSettingsTabs() {
    const tabs = document.querySelectorAll('.settings-tab');
    const contents = document.querySelectorAll('.settings-content');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.add('hidden'));

        tab.classList.add('active');
        const contentId = tab.getAttribute('data-tab');
        document.getElementById(contentId).classList.remove('hidden');
      });
    });
  }
}
