// Function to render a single tab
export function renderTab(tab, container = null) {
  const tabElement = document.createElement("div");
  tabElement.className = "tab";
  tabElement.setAttribute("data-tab-id", tab.id);

  // Create favicon container
  const favicon = document.createElement("img");
  favicon.className = "tab-favicon";
  favicon.src = tab.favIconUrl || "./images/favicon.png";
  favicon.onerror = () => {
    favicon.src = "./images/favicon.png";
  };

  // Create title element
  const title = document.createElement("div");
  title.className = "tab-title";
  title.textContent = tab.title;

  // Create URL element
  const url = document.createElement("div");
  url.className = "tab-url";
  url.textContent = tab.url;

  // Create close button
  const closeBtn = document.createElement("div");
  closeBtn.className = "tab-close";
  closeBtn.textContent = "✕";
  closeBtn.title = "Close tab";

  // Add click handler for the tab
  tabElement.addEventListener("click", (e) => {
    if (!e.target.matches(".tab-close")) {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });

  // Add click handler for close button
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    chrome.tabs.remove(tab.id);
    tabElement.remove();
  });

  // Assemble the tab element
  tabElement.appendChild(favicon);
  tabElement.appendChild(title);
  tabElement.appendChild(url);
  tabElement.appendChild(closeBtn);

  // Add to container or tabs list
  if (container) {
    container.appendChild(tabElement);
  } else {
    document.getElementById("tabs-list").appendChild(tabElement);
  }

  return tabElement;
}
