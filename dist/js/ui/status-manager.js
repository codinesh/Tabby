// UI utility for managing status messages
export class StatusManager {
  constructor() {
    this.container = document.getElementById("status-container");
    this.message = document.getElementById("status-message");
    this.spinner = document.getElementById("loading-spinner");
    this.activeTimer = null;
    this.isVisible = false;
  }

  showStatus(message, isError = false) {
    // Clear any existing timer
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }

    // Set message content and class
    this.message.textContent = message;
    this.message.className = isError ? "error" : "success";

    // Make sure the spinner is hidden
    this.spinner.style.display = "none";

    // Show the container if it's not already visible
    if (this.container.classList.contains("hidden")) {
      this.container.classList.remove("hidden");
    }

    this.isVisible = true;

    // Set a timer to hide the message
    this.activeTimer = setTimeout(() => {
      this.container.classList.add("hidden");
      this.isVisible = false;
      this.activeTimer = null;
    }, 3000);
  }

  showLoading(message = "Loading...") {
    // Clear any existing timer
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }

    // Set message content and ensure no special classes
    this.message.textContent = message;
    this.message.className = "";

    // Show spinner
    this.spinner.style.display = "block";

    // Show the container
    if (this.container.classList.contains("hidden")) {
      this.container.classList.remove("hidden");
    }

    this.isVisible = true;
  }

  hideLoading() {
    // Hide spinner
    this.spinner.style.display = "none";

    // Hide the container if no active timer (which would be for a status message)
    if (!this.activeTimer) {
      this.container.classList.add("hidden");
      this.isVisible = false;
    }
  }

  // New method to immediately hide any visible message
  clearStatus() {
    if (this.activeTimer) {
      clearTimeout(this.activeTimer);
      this.activeTimer = null;
    }
    this.container.classList.add("hidden");
    this.spinner.style.display = "none";
    this.isVisible = false;
  }
}
