// UI utility for managing status messages
export class StatusManager {
  constructor() {
    this.container = document.getElementById('status-container');
    this.message = document.getElementById('status-message');
    this.spinner = document.getElementById('loading-spinner');
  }

  showStatus(message, isError = false) {
    this.message.textContent = message;
    this.message.className = isError ? 'error' : 'success';
    this.container.classList.remove('hidden');
    this.spinner.style.display = 'none';
    
    setTimeout(() => {
      this.container.classList.add('hidden');
    }, 3000);
  }

  showLoading(message = 'Loading...') {
    this.message.textContent = message;
    this.message.className = '';
    this.container.classList.remove('hidden');
    this.spinner.style.display = 'block';
  }

  hideLoading() {
    this.spinner.style.display = 'none';
    this.container.classList.add('hidden');
  }
}
