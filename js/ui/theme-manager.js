// Theme management functionality
export class ThemeManager {
  constructor() {
    this.themeToggle = document.getElementById("theme-toggle");
    this.prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  }

  initialize() {
    const theme = localStorage.getItem("theme") || "system";
    this.applyTheme(theme);

    // Listen for system theme changes
    this.prefersDark.addEventListener("change", () => {
      if (localStorage.getItem("theme") === "system") {
        this.applyTheme("system");
      }
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

  toggle() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", newTheme);
    this.applyTheme(newTheme);
  }
}
