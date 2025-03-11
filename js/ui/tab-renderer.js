// UI components for rendering tabs and groups
export class TabRenderer {
  constructor(tabManager, settingsManager) {
    this.tabManager = tabManager;
    this.settingsManager = settingsManager;
    this.tabsList = document.getElementById("tabs-list");
  }

  createTabElement(tab) {
    const tabElement = document.createElement("div");
    tabElement.className = "tab";
    tabElement.setAttribute("data-tab-id", tab.id);

    const favicon = document.createElement("img");
    favicon.className = "tab-favicon";
    favicon.src = tab.favIconUrl || "./images/favicon.png";
    favicon.onerror = () => (favicon.src = "./images/favicon.png");

    const title = document.createElement("div");
    title.className = "tab-title";
    title.textContent = tab.title;

    const url = document.createElement("div");
    url.className = "tab-url";
    url.textContent = tab.url;

    const closeBtn = document.createElement("div");
    closeBtn.className = "tab-close";
    closeBtn.textContent = "✕";
    closeBtn.title = "Close tab";

    // Add event listeners
    tabElement.addEventListener("click", async (e) => {
      if (!e.target.matches(".tab-close")) {
        await this.tabManager.activateTab(tab.id, tab.windowId);
      }
    });

    closeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.tabManager.closeTab(tab.id);
      tabElement.remove();
    });

    tabElement.append(favicon, title, url, closeBtn);
    return tabElement;
  }

  createGroupElement(group, tabs, isCollapsed = false) {
    const groupElement = document.createElement("div");
    groupElement.className = "tab-group";
    groupElement.setAttribute("data-group-id", group.id);
    if (isCollapsed) groupElement.classList.add("collapsed");

    const header = document.createElement("div");
    header.className = "group-header";
    if (group.color) header.classList.add(group.color);

    const collapseIndicator = document.createElement("span");
    collapseIndicator.className = "collapse-indicator";
    collapseIndicator.textContent = isCollapsed ? "▶" : "▼";

    const groupTitle = document.createElement("span");
    groupTitle.className = "group-title";
    groupTitle.textContent = group.title || "Unnamed Group";

    const groupCount = document.createElement("span");
    groupCount.className = "group-count";
    groupCount.textContent = `${tabs.length} tabs`;

    const groupActions = document.createElement("div");
    groupActions.className = "group-actions";

    const ungroupButton = document.createElement("button");
    ungroupButton.className = "group-close";
    ungroupButton.title = "Ungroup tabs";
    ungroupButton.textContent = "×";

    groupActions.appendChild(ungroupButton);
    header.append(collapseIndicator, groupTitle, groupCount, groupActions);

    const tabsContainer = document.createElement("div");
    tabsContainer.className = "tabs-container";
    tabs.forEach((tab) => {
      const tabElement = this.createTabElement(tab);
      tabsContainer.appendChild(tabElement);
    });

    groupElement.append(header, tabsContainer);

    // Add event listener for ungroup button
    ungroupButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        await this.tabManager.ungroupTabs(group.id);
        await this.renderTabs();
      } catch (error) {
        console.error("Error ungrouping tabs:", error);
      }
    });

    // Add event listener for collapse/expand
    header.addEventListener("click", async (e) => {
      // Don't collapse if clicking the ungroup button
      if (e.target.matches(".group-close")) return;

      const wasCollapsed = groupElement.classList.contains("collapsed");
      groupElement.classList.toggle("collapsed");
      collapseIndicator.textContent = wasCollapsed ? "▼" : "▶";

      // Save collapsed state
      if (group.id) {
        await this.settingsManager.saveCollapsedState(group.id, !wasCollapsed);
      }
    });

    return groupElement;
  }

  async renderTabs() {
    this.tabsList.innerHTML = "";
    const tabs = await this.tabManager.getAllTabs();
    const tabGroups = await this.tabManager.getAllTabGroups();

    // Create a map of group IDs to their details
    const groupMap = new Map(tabGroups.map((group) => [group.id, group]));

    // Get collapsed state
    const collapsedGroups = await this.settingsManager.getCollapsedStates();

    // Separate grouped and ungrouped tabs
    const groupedTabs = new Map();
    const ungroupedTabs = [];

    tabs.forEach((tab) => {
      if (tab.groupId !== -1) {
        if (!groupedTabs.has(tab.groupId)) {
          groupedTabs.set(tab.groupId, []);
        }
        groupedTabs.get(tab.groupId).push(tab);
      } else {
        ungroupedTabs.push(tab);
      }
    });

    // Render grouped tabs
    for (const [groupId, tabs] of groupedTabs) {
      const group = groupMap.get(groupId);
      if (!group) continue;

      const isCollapsed = collapsedGroups[groupId] || false;
      const groupElement = this.createGroupElement(group, tabs, isCollapsed);
      this.tabsList.appendChild(groupElement);
    }

    // Render ungrouped tabs
    if (ungroupedTabs.length > 0) {
      const ungroupedElement = this.createGroupElement(
        { id: "ungrouped", title: "Ungrouped Tabs" },
        ungroupedTabs,
        collapsedGroups["ungrouped"] || false
      );
      this.tabsList.appendChild(ungroupedElement);
    }
  }

  filterTabs(query) {
    const searchText = query.toLowerCase();
    const tabElements = document.querySelectorAll(".tab");

    tabElements.forEach((tabElement) => {
      const title = tabElement
        .querySelector(".tab-title")
        .textContent.toLowerCase();
      const url = tabElement
        .querySelector(".tab-url")
        .textContent.toLowerCase();
      const matches = title.includes(searchText) || url.includes(searchText);
      tabElement.style.display = matches ? "" : "none";
    });

    // Update group visibility
    document.querySelectorAll(".tab-group").forEach((group) => {
      const visibleTabs = group.querySelectorAll('.tab[style=""]').length;
      group.style.display = visibleTabs > 0 ? "" : "none";
    });
  }
}
