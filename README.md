# Tabby - Smart Tab Manager

Tabby is a lightweight browser extension that revolutionizes how you organize your tabs using intelligent domain-based grouping and custom organization rules.

<div style="display: flex; justify-content: space-between;">
   <img src="images/screenshots/home.png" alt="Tabby home page" width="48%"/>
   <img src="images/screenshots/settings.png" alt="Settings page" width="48%"/>
</div>

## Key Features

- 🔄 **Smart Domain Grouping** - Automatically groups tabs from the same website
- ⚡️ **Instant Tab Access** - Quick search and switch between tabs
- 🎯 **Custom Group Rules** - Create personalized grouping rules with keywords
- 🎨 **Color Customization** - Choose colors for your tab groups
- 🚀 **Lightweight** - Minimal resource usage for optimal browser performance

## Quick Installation

### Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (Coming Soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Download this repository
2. Generate distribution files (see Build Instructions)
3. Go to `chrome://extensions/` (or equivalent for your browser)
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `dist` folder after building

## Build Instructions

### Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)

### Building the Extension

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tabby.git
   cd tabby
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate distribution files:
   ```bash
   npm run build
   ```
   This will:
   - Create a `dist` folder with the optimized extension files
   - Copy all necessary files to the distribution folder
   - Generate a `tabby.zip` file ready for submission to the Chrome Web Store

### Installing from the Build Directory

1. Build the extension as described above
2. Open Chrome/Brave/Edge and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked"
5. Select the `dist` folder that was created during the build process
6. The extension should now be installed and active

## Setup Guide

### Basic Usage

1. Click the Tabby icon in your toolbar
2. Choose your preferred grouping method:
   - 🌐 Domain-based Grouping
   - ✨ Custom Grouping

### Custom Groups Configuration

1. Navigate to Settings (⋮ menu)
2. Add groups with relevant keywords and choose colors
3. Save to apply custom grouping rules

## Keyboard Shortcuts

- `Alt + T`: Open Tabby popup
- `Alt + G`: Quick group by domain
- `Alt + U`: Ungroup all tabs

## Browser Compatibility

- ✅ Google Chrome (v88+)
- ✅ Microsoft Edge
- ✅ Brave Browser
- ✅ Other Chromium-based browsers

## Project Structure

```
tabby/
├── background.js        # Background service worker
├── manifest.json        # Extension manifest
├── popup.html           # Main popup interface
├── popup.css            # Styles for popup
├── popup.js             # Popup functionality
├── images/              # Icons and screenshots
├── js/                  # JavaScript modules
│   ├── core/            # Core functionality
│   │   ├── settings.js  # Settings management
│   │   └── tabs.js      # Tab operations
│   └── ui/              # UI components
├── lib/                 # External libraries
└── scripts/             # Build scripts
    └── build.sh         # Build script for generating distribution files
```

## Troubleshooting

### Common Issues

- **Groups Not Forming**: Check browser permissions
- **Custom Rules Not Applied**: Verify keyword formatting
- **Build Errors**: Make sure Node.js is installed and up to date

### Size Optimization

The build script optimizes the extension size by:
- Including only the necessary files for functionality
- Minimizing included assets

### Need Help?

- 🐛 Report issues on [GitHub](https://github.com/yourusername/tabby/issues)
- 📧 Contact: [your-support-email]

## Privacy & Security

- ✅ No user data collection
- ✅ Local storage only
- ✅ Open-source code

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

MIT License - See [LICENSE](LICENSE) file for details

---

_Made with ❤️ by the Tabby team_
