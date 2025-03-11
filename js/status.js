// Status message handling functions
export function showStatus(message, type = "info", autoHide = true) {
  const statusContainer = document.getElementById("status-container");
  const statusMessage = document.getElementById("status-message");
  const loadingSpinner = document.getElementById("loading-spinner");

  // Clear previous status classes
  statusContainer.classList.remove("success", "error", "info");

  // Set the message and type
  statusMessage.textContent = message;
  statusContainer.classList.add(type);
  statusContainer.classList.remove("hidden");

  // Hide spinner when showing a regular status message
  loadingSpinner.style.display = "none";

  // Auto-hide the status after 3 seconds if autoHide is true
  if (autoHide) {
    setTimeout(() => {
      hideStatus();
    }, 3000);
  }
}

export function hideStatus() {
  const statusContainer = document.getElementById("status-container");
  statusContainer.classList.add("hidden");
}

export function showLoading(message = "Processing...") {
  const statusContainer = document.getElementById("status-container");
  const statusMessage = document.getElementById("status-message");
  const loadingSpinner = document.getElementById("loading-spinner");

  // Set the message
  statusMessage.textContent = message;

  // Show container and spinner
  statusContainer.classList.remove("hidden");
  statusContainer.classList.remove("success", "error");
  statusContainer.classList.add("info");

  // Always display the spinner for loading
  loadingSpinner.style.display = "inline-block";
}

export function hideLoading() {
  const loadingSpinner = document.getElementById("loading-spinner");
  loadingSpinner.style.display = "none";
}
