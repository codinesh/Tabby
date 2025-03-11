// Menu and context menu functionality
export class MenuManager {
  constructor() {
    this.menuButton = document.getElementById("menu-button");
    this.contextMenu = document.getElementById("context-menu");
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Close context menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.contextMenu.contains(e.target) && e.target !== this.menuButton) {
        this.contextMenu.classList.add("hidden");
      }
    });
  }

  toggleContextMenu() {
    this.contextMenu.classList.toggle("hidden");
  }
}
