import { ICONS } from "./icons.js";

export class ThemeManager {
  constructor(settingsManager) {
    this.settingsManager = settingsManager;
  }

  async initialize() {
    const theme = await this.settingsManager.getTheme();
    this.setTheme(theme);

    // Watch for system theme changes if using system theme
    if (theme === "system") {
      this.watchSystemTheme();
    }
  }

  toggle() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    this.setTheme(newTheme);
    this.settingsManager.saveTheme(newTheme);
  }

  setTheme(theme) {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
  }

  watchSystemTheme() {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", (e) => {
        this.setTheme("system");
      });
  }
}
