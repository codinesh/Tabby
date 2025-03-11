// Theme management functionality
export class ThemeManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
    this.themeToggle = document.getElementById("theme-toggle");
    this.prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  }

  async initialize() {
    const theme = await this.settingsManager.getTheme();
    this.applyTheme(theme);

    // Listen for system theme changes
    this.prefersDark.addEventListener("change", () => {
      this.applyTheme(theme);
    });
  }

  applyTheme(theme) {
    if (theme === "system") {
      document.documentElement.setAttribute(
        "data-theme",
        this.prefersDark.matches ? "dark" : "light"
      );
    } else {
      document.documentElement.setAttribute("data-theme", theme);
    }

    // Update theme toggle button
    this.themeToggle.textContent =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "☀️"
        : "🌙";
  }

  async toggle() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    await this.settingsManager.saveTheme(newTheme);
    this.applyTheme(newTheme);
  }
}
