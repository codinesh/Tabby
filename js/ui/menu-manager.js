import { ICONS } from "./icons.js";

// Menu and context menu functionality
export class MenuManager {
  constructor() {
    this.menuButton = document.getElementById("menu-button");
    this.contextMenu = document.getElementById("context-menu");
    this.isOpen = false;
    this.setupEventListeners();
  }

  get menuItems() {
    // Get menu items dynamically to ensure we have the latest DOM state
    return this.contextMenu.querySelectorAll("button[role='menuitem']");
  }

  setupEventListeners() {
    // Toggle menu on button click
    this.menuButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.toggleContextMenu();
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !this.contextMenu.contains(e.target) &&
        e.target !== this.menuButton
      ) {
        this.closeContextMenu();
      }
    });

    // Close menu on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.isOpen) {
        this.closeContextMenu();
        this.menuButton.focus();
      }
    });

    // Handle keyboard navigation within menu
    this.contextMenu.addEventListener("keydown", (e) => {
      if (!this.isOpen) return;

      const items = Array.from(this.menuItems);
      const currentIndex = items.indexOf(document.activeElement);

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          const prevIndex =
            currentIndex > 0 ? currentIndex - 1 : items.length - 1;
          items[prevIndex].focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          const nextIndex =
            currentIndex < items.length - 1 ? currentIndex + 1 : 0;
          items[nextIndex].focus();
          break;
        case "Home":
          e.preventDefault();
          items[0].focus();
          break;
        case "End":
          e.preventDefault();
          items[items.length - 1].focus();
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          document.activeElement.click();
          this.closeContextMenu();
          break;
        case "Tab":
          e.preventDefault(); // Prevent tabbing out of menu
          break;
      }
    });

    // Handle menu item clicks
    this.contextMenu.addEventListener("click", (e) => {
      const menuItem = e.target.closest("[role='menuitem']");
      if (menuItem) {
        this.closeContextMenu();
      }
    });
  }

  toggleContextMenu() {
    if (this.isOpen) {
      this.closeContextMenu();
    } else {
      this.openContextMenu();
    }
  }

  openContextMenu() {
    // Remove hidden class first
    this.contextMenu.classList.remove("hidden");

    // Force a reflow to ensure the transition works
    this.contextMenu.offsetHeight;

    // Add visible class to trigger animation
    this.contextMenu.classList.add("visible");
    this.isOpen = true;

    // Set ARIA attributes
    this.menuButton.setAttribute("aria-expanded", "true");

    // Focus the first menu item
    const items = this.menuItems;
    if (items.length > 0) {
      items[0].focus();
    }
  }

  closeContextMenu() {
    // Remove visible class first to trigger animation
    this.contextMenu.classList.remove("visible");

    // Wait for animation to complete before hiding
    setTimeout(() => {
      if (!this.isOpen) {
        this.contextMenu.classList.add("hidden");
      }
    }, 200); // Match the CSS transition duration

    this.isOpen = false;
    this.menuButton.setAttribute("aria-expanded", "false");
  }
}
