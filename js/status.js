// Status message handling functions
export function showStatus(message, type = "info", autoHide = true) {
  const statusContainer = document.getElementById("status-container");
  const statusMessage = document.getElementById("status-message");
  const loadingSpinner = document.getElementById("loading-spinner");
  
  // Remove all status classes
  statusContainer.classList.remove("error", "success", "warning", "info");
  
  // Add the appropriate status class
  statusContainer.classList.add(type);
  statusContainer.classList.remove("hidden");
  
  // Hide loading spinner for status messages
  loadingSpinner.style.display = "none";
  
  // Set the message
  statusMessage.textContent = message;
  
  // Auto-hide after 3 seconds if enabled
  if (autoHide) {
    setTimeout(() => {
      statusContainer.classList.add("hidden");
    }, 3000);
  }
}

export function showLoading(message = "Loading...") {
  const statusContainer = document.getElementById("status-container");
  const statusMessage = document.getElementById("status-message");
  const loadingSpinner = document.getElementById("loading-spinner");
  
  // Remove all status classes
  statusContainer.classList.remove("error", "success", "warning");
  statusContainer.classList.add("info");
  statusContainer.classList.remove("hidden");
  
  // Show loading spinner
  loadingSpinner.style.display = "inline-block";
  
  // Set the message
  statusMessage.textContent = message;
}

export function hideLoading() {
  const statusContainer = document.getElementById("status-container");
  const loadingSpinner = document.getElementById("loading-spinner");
  
  statusContainer.classList.add("hidden");
  loadingSpinner.style.display = "none";
}

export function hideStatus() {
  const statusContainer = document.getElementById("status-container");
  const loadingSpinner = document.getElementById("loading-spinner");
  
  statusContainer.classList.add("hidden");
  loadingSpinner.style.display = "none";
}
