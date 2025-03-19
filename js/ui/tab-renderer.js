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

  createGroupElement(group, tabs, isCollapsed = false) {
    const groupElement = document.createElement("div");
    groupElement.className = "tab-group";
    groupElement.setAttribute("data-group-id", group.id);
    if (isCollapsed) groupElement.classList.add("collapsed");

    const header = document.createElement("div");
    header.className = "group-header";
    if (group.color) header.classList.add(group.color);

    // Create left side of header (icon and title)
    const headerLeft = document.createElement("div");
    headerLeft.className = "group-header-left";

    const collapseIndicator = document.createElement("span");
    collapseIndicator.className = "collapse-indicator";
    // Use SVG icons instead of emoji
    collapseIndicator.innerHTML = isCollapsed
      ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>' // chevron down
      : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>'; // chevron up
    collapseIndicator.setAttribute(
      "aria-label",
      isCollapsed ? "Expand group" : "Collapse group"
    );

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

    // Add event listener for collapse/expand
    header.addEventListener("click", async (e) => {
      // Skip if clicking on close button
      if (e.target.closest(".group-close")) return;

      // Toggle collapsed state for UI
      const wasCollapsed = groupElement.classList.contains("collapsed");
      const newCollapsedState = !wasCollapsed;

      // Debug logging
      console.log(
        `Toggling group ${group.id} collapsed state: ${wasCollapsed} -> ${newCollapsedState}`
      );

      // Update UI immediately for better feedback
      groupElement.classList.toggle("collapsed");

      // Update the collapse indicator with the appropriate SVG
      collapseIndicator.innerHTML = newCollapsedState
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>' // chevron down
        : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>'; // chevron up

      collapseIndicator.setAttribute(
        "aria-label",
        newCollapsedState ? "Expand group" : "Collapse group"
      );

      // Update browser tab group and storage
      try {
        if (group.id && group.id !== "ungrouped") {
          await this.tabManager.setTabGroupCollapsed(
            group.id,
            newCollapsedState
          );
        } else if (group.id === "ungrouped") {
          // Just save the state for ungrouped tabs
          await this.settingsManager.setCollapsedState(
            group.id,
            newCollapsedState
          );
        }
      } catch (error) {
        console.error("Error updating tab group collapsed state:", error);
        // Revert UI if update fails
        groupElement.classList.toggle("collapsed");
        collapseIndicator.innerHTML = wasCollapsed
          ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>' // chevron down
          : '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>'; // chevron up
      }
    });

    return groupElement;
  }

  async renderTabs() {
    try {
      const [tabs, tabGroups, collapsedGroups] = await Promise.all([
        this.tabManager.getAllTabs(),
        this.tabManager.getAllTabGroups(),
        this.settingsManager.getCollapsedStates(),
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

        // Check if there's a saved collapsed state, if not use the browser's state
        const isCollapsed = collapsedGroups.hasOwnProperty(groupId.toString())
          ? collapsedGroups[groupId.toString()]
          : group.collapsed;

        // If we're using the browser's state, make sure to save it
        if (!collapsedGroups.hasOwnProperty(groupId.toString())) {
          this.settingsManager.setCollapsedState(
            groupId.toString(),
            group.collapsed
          );
        }

        const groupElement = this.createGroupElement(group, tabs, isCollapsed);
        this.tabsList.appendChild(groupElement);
      }

      // Render ungrouped tabs
      if (ungroupedTabs.length > 0) {
        const isUngroupedCollapsed = collapsedGroups.hasOwnProperty("ungrouped")
          ? collapsedGroups["ungrouped"]
          : false;

        const ungroupedElement = this.createGroupElement(
          { id: "ungrouped", title: "Ungrouped Tabs" },
          ungroupedTabs,
          isUngroupedCollapsed
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
