import { ICONS } from "./icons.js";

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
    title.title = tab.title; // Add tooltip for long titles

    const url = document.createElement("div");
    url.className = "tab-url";
    url.textContent = tab.url;
    url.title = tab.url; // Add tooltip for long URLs

    const closeBtn = document.createElement("button");
    closeBtn.className = "tab-close";
    closeBtn.textContent = "✕";
    closeBtn.title = "Close tab";
    closeBtn.setAttribute("aria-label", "Close tab");

    // Add event listeners
    tabElement.addEventListener("click", (e) => {
      if (!e.target.matches(".tab-close")) {
        this.tabManager.activateTab(tab.id, tab.windowId);
      }
    });

    closeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.tabManager.closeTab(tab.id);
      await this.renderTabs();
    });

    tabElement.append(favicon, title, url, closeBtn);
    return tabElement;
  }

  async renderTabGroup(group, tabs) {
    const groupElement = document.createElement("div");
    groupElement.className = "tab-group";
    groupElement.dataset.groupId = group.id;

    // Use only the browser's collapsed state
    if (group.collapsed) {
      groupElement.classList.add("collapsed");
    }

    // Create group header
    const header = document.createElement("div");
    header.className = `group-header ${group.color || "grey"}`;
    header.addEventListener("click", async (e) => {
      if (!e.target.closest(".tab-close")) {
        const isCollapsed = !groupElement.classList.contains("collapsed");
        await this.tabManager.setTabGroupCollapsed(group.id, isCollapsed);

        // Update UI directly after toggling
        groupElement.classList.toggle("collapsed");
        const indicator = groupElement.querySelector(".collapse-indicator");
        if (indicator) {
          indicator.style.transform = isCollapsed
            ? "rotate(0deg)"
            : "rotate(90deg)";
          indicator.setAttribute(
            "aria-label",
            isCollapsed ? "Expand group" : "Collapse group"
          );
        }
      }
    });

    // Create left side of header (icon and title)
    const headerLeft = document.createElement("div");
    headerLeft.className = "group-header-left";

    const collapseIndicator = document.createElement("span");
    collapseIndicator.className = "collapse-indicator";
    collapseIndicator.innerHTML = ICONS.CHEVRON;
    if (group.collapsed) {
      collapseIndicator.style.transform = "rotate(0deg)";
    } else {
      collapseIndicator.style.transform = "rotate(90deg)";
    }

    const groupTitle = document.createElement("span");
    groupTitle.className = "group-title";
    groupTitle.textContent = group.title || "Unnamed Group";

    headerLeft.append(collapseIndicator, groupTitle);

    // Create right side of header (count and actions)
    const headerRight = document.createElement("div");
    headerRight.className = "group-header-right";

    const groupCount = document.createElement("span");
    groupCount.className = "group-count";
    groupCount.textContent = `${tabs.length} tabs`;

    const groupActions = document.createElement("div");
    groupActions.className = "group-actions";

    if (group.id !== "ungrouped") {
      const ungroupButton = document.createElement("button");
      ungroupButton.className = "group-close";
      ungroupButton.title = "Ungroup tabs";
      ungroupButton.textContent = "×";
      ungroupButton.setAttribute("aria-label", "Ungroup tabs");

      ungroupButton.addEventListener("click", async (e) => {
        e.stopPropagation();
        try {
          await this.tabManager.closeTabGroup(group.id);
          await this.renderTabs();
        } catch (error) {
          console.error("Error ungrouping tabs:", error);
        }
      });

      groupActions.appendChild(ungroupButton);
    }

    headerRight.append(groupCount, groupActions);

    // Assemble the header with left and right sides
    header.append(headerLeft, headerRight);

    const tabsContainer = document.createElement("div");
    tabsContainer.className = "tabs-container";
    tabs.forEach((tab) =>
      tabsContainer.appendChild(this.createTabElement(tab))
    );

    groupElement.append(header, tabsContainer);

    return groupElement;
  }

  async renderTabs() {
    try {
      const [tabs, tabGroups] = await Promise.all([
        this.tabManager.getAllTabs(),
        this.tabManager.getAllTabGroups(),
      ]);

      // Create a map of group IDs to their details
      const groupMap = new Map(tabGroups.map((group) => [group.id, group]));

      // Clear existing tabs
      this.tabsList.innerHTML = "";

      // Organize tabs by groups
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

        const groupElement = await this.renderTabGroup(group, tabs);
        this.tabsList.appendChild(groupElement);
      }

      // Render ungrouped tabs
      if (ungroupedTabs.length > 0) {
        const ungroupedElement = await this.renderTabGroup(
          { id: "ungrouped", title: "Ungrouped Tabs" },
          ungroupedTabs
        );
        this.tabsList.appendChild(ungroupedElement);
      }
    } catch (error) {
      console.error("Error rendering tabs:", error);
      this.tabsList.innerHTML = `<div class="error-message">Error loading tabs: ${error.message}</div>`;
    }
  }

  filterTabs(query) {
    const searchText = query.toLowerCase();
    const tabElements = document.querySelectorAll(".tab");
    let visibleTabsCount = new Map();

    tabElements.forEach((tabElement) => {
      const title = tabElement
        .querySelector(".tab-title")
        .textContent.toLowerCase();
      const url = tabElement
        .querySelector(".tab-url")
        .textContent.toLowerCase();
      const matches = title.includes(searchText) || url.includes(searchText);
      tabElement.style.display = matches ? "" : "none";

      if (matches) {
        const group = tabElement.closest(".tab-group");
        const groupId = group.dataset.groupId;
        visibleTabsCount.set(groupId, (visibleTabsCount.get(groupId) || 0) + 1);
      }
    });

    // Update group visibility and counts
    document.querySelectorAll(".tab-group").forEach((group) => {
      const groupId = group.dataset.groupId;
      const visibleTabs = visibleTabsCount.get(groupId) || 0;
      group.querySelector(".group-count").textContent = `${visibleTabs} tabs`;
      group.style.display = visibleTabs > 0 ? "" : "none";
    });
  }
}
