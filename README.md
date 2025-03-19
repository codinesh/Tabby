# Tabby - AI-Powered Tab Manager

Tabby is a smart browser extension that revolutionizes how you organize your tabs using AI-powered categorization and intelligent domain-based grouping.

<div style="display: flex; justify-content: space-between;">
   <img src="images/screenshots/home.png" alt="Tabby home page" width="48%"/>
   <img src="images/screenshots/settings.png" alt="Settings page" width="48%"/>
</div>

## Key Features

- 🤖 **AI-Powered Tab Organization** - Intelligently categorizes your tabs based on content
- 🔄 **Smart Domain Grouping** - Automatically groups tabs from the same website
- ⚡️ **Instant Tab Access** - Quick search and switch between tabs
- 🎯 **Custom Group Rules** - Create personalized grouping rules with keywords
- 🔒 **Privacy-Focused** - Your data stays local; API calls only when needed
- ⚙️ **Flexible Configuration** - Customize the extension to work your way

## Quick Installation

### Chrome Web Store (Recommended)

1. Visit the [Chrome Web Store](https://chrome.google.com/webstore) (Coming Soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)

1. Download this repository
2. Go to `chrome://extensions/` (or equivalent for your browser)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the Tabby folder or the `dist` folder after building

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

3. Build the extension:
   ```bash
   npm run build
   ```
   This will:
   - Create a `dist` folder with the optimized extension files
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
   - 🤖 AI Categorization
   - 🌐 Domain-based Grouping

### AI Feature Setup (Optional)

1. Open Settings (⋮ menu)
2. Enter your OpenAI API details:
   - API Endpoint (default: `https://api.openai.com/v1/chat/completions`)
   - API Key
3. Save changes

### Custom Groups Configuration

1. Navigate to Settings > Custom Groups
2. Add groups with relevant keywords
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
│   └── transformers.min.js  # AI transformer library
└── scripts/             # Build scripts
```

## Troubleshooting

### Common Issues

- **API Not Working**: Verify API key and endpoint
- **Groups Not Forming**: Check browser permissions
- **Custom Rules Not Applied**: Verify keyword formatting
- **Build Errors**: Make sure Node.js is installed and up to date

### Size Optimization

The build script optimizes the extension size by:
- Including only the necessary WASM files for AI functionality
- Minimizing included assets
- Using minified JavaScript files

### Need Help?

- 📜 Check our [Wiki](https://github.com/yourusername/tabby/wiki)
- 🐛 Report issues on [GitHub](https://github.com/yourusername/tabby/issues)
- 📧 Contact: [your-support-email]

## Privacy & Security

- ✅ No user data collection
- ✅ Local storage only
- ✅ Optional AI feature with your own API key
- ✅ Open-source code

## Contributing

We welcome contributions!

## License

MIT License - See [LICENSE](LICENSE) file for details

---

_Made with ❤️ by the Tabby team_
