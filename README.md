# Tab Group Manager - Chrome Extension

A Chrome extension (Manifest V3) that automatically organizes browser tabs into groups using native Chrome tab groups.

## Features

- **Auto-Grouping**: Automatically groups tabs based on URL changes
- **Multiple Strategies**:
  - **Domain**: Group by full domain (e.g., github.com)
  - **Secondary Domain**: Group by second-level domain (e.g., github.com from user.github.com)
  - **Custom Rules**: Define your own grouping patterns
- **Parent Group Inheritance**: When clicking a link in a grouped tab, new tabs automatically join the parent's group (configurable)
- **Custom Rules Editor**: Create patterns for domain or URL matching with custom colors
- **Drag & Drop Strategy Ordering**: Reorder strategies in options page to set priority
- **Keyboard Shortcuts**:
  - `Alt+Shift+G` - Toggle auto-grouping
  - `Alt+Shift+T` - Group current tab
  - `Alt+Shift+U` - Ungroup current tab
- **Import/Export**: Backup and restore custom rules as JSON

## Project Structure

```
tab-group-manager/
├── manifest.json              # Extension manifest (MV3)
├── service-worker.js          # Background service worker
├── options.html               # Settings page
├── options.js                 # Settings logic
├── options.css                # Settings styles
├── popup/
│   ├── popup.html             # Extension popup UI
│   ├── popup.js               # Popup logic
│   └── popup.css              # Popup styles
├── shared/
│   ├── config.js              # Default config and validation
│   ├── configuration.js       # Custom rule matching logic
│   ├── storage.js             # Chrome storage helpers
│   ├── strategies.js          # Grouping strategy implementations
│   └── utils.js               # Domain extraction and pattern matching
├── images/
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   └── icon-128.png
└── _locales/
    └── en/
        └── messages.json      # i18n strings
```

## Configuration

The extension stores configuration in `chrome.storage.sync`:

```javascript
{
  enableAutoGroup: true,       // Enable/disable auto-grouping
  groupTabNum: 1,              // Minimum tabs to form a group
  groupStrategy: [1, 2, 3],  // Array of strategies in priority order
  inheritParentGroup: true,    // New tab inherits opener's group
  configuration: {
    fallback: "none",         // "none" | "domain" | "secDomain"
    rules: []                 // Custom rules for strategy 3
  }
}
```

### Grouping Strategies

The extension supports multiple strategies that are tried in order:

1. **Domain Strategy (1)**: Groups tabs by full domain
   - Example: `github.com/user/repo` and `github.com/issues` go to same group

2. **Secondary Domain Strategy (2)**: Groups by second-level domain
   - Handles country-code TLDs like `.co.uk`, `.com.au`, etc.
   - Example: `user.github.com` and `github.com` can be grouped together

3. **Custom Rules Strategy (3)**: Pattern-based grouping with custom names and colors
   - Define patterns matching domains or URLs
   - Assign custom group titles and colors

### Strategy Priority

When multiple strategies are enabled, they are tried in order. The first strategy that produces a match wins. You can reorder strategies in the options page to set priority.

## Custom Rules

Custom rules allow you to define pattern-based grouping:

```javascript
{
  name: "GitHub",
  color: "blue",
  patterns: [
    { pattern: "github.com", matchType: "domain" }
  ]
}
```

- **pattern**: Wildcard pattern (e.g., `*.github.com`, `github.com/*`)
- **matchType**: `"domain"` or `"url"`
  - `domain`: Matches against the hostname
  - `url`: Matches against the full URL

### Pattern Examples

- `github.com` - Matches any GitHub domain
- `*.github.com` - Matches any subdomain of GitHub
- `github.com/*` - Matches GitHub URLs with any path
- `docs.google.com` - Matches Google Docs
- `*.example.com` - Matches any subdomain of example.com

## Installation

### Development Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the extension directory

### Production Installation

Available on Chrome Web Store (coming soon)

## Permissions

The extension requests minimal permissions:

- **`storage`**: Save user preferences and custom rules
- **`tabs`**: Read tab URLs and organize tabs into groups
- **`tabGroups`**: Create, modify, and organize tab groups

No host permissions are required - all processing is done locally in your browser.

## Privacy Policy

See [PRIVACY.md](PRIVACY.md) for detailed privacy information.

## Development

### Build

No build process required - the extension uses vanilla JavaScript and CSS.

### Testing

1. Load the extension in Chrome Developer mode
2. Open tabs from different domains
3. Configure strategies in options page
4. Verify tabs are grouped automatically or manually

## Changelog

### 0.1.0 (Initial Release)

- Initial release
- Auto-grouping on tab updates
- Multiple grouping strategies (domain, secondary domain, custom rules)
- Custom rules editor with pattern matching
- Drag & drop strategy ordering
- Parent group inheritance
- Keyboard shortcuts
- Import/Export custom rules
- Popup for quick actions

## License

MIT License - see LICENSE file for detailsGlob-style wildcard (e.g., "*.github.com")
- **matchType**: "domain" (match domain only) or "url" (match full URL)

## Installation

1. Open Chrome and navigate to `chrome://extensions`
2. Enable "Developer mode" in the top-right corner
3. Click "Load unpacked"
4. Select the `tab-group-manager` directory

## Fixed Issues

**Issue 1**: Popup's "Open Options" link was using relative path `options.html` which resolves incorrectly to `popup/options.html` when opened from popup context.
- **Fix**: Changed to absolute path `/options.html` in popup/popup.html

**Issue 2**: Manifest contained invalid `schema` key which caused Chrome extension management errors.
- **Fix**: Removed entire `schema` section from manifest.json (lines 57-124)

**Issue 3**: `chrome.tabGroups.query` was using `currentWindow: true` which is not supported by the API, and `tabGroups.update` was receiving `undefined` values for color/title.
- **Fixes**:
  - Changed `chrome.tabGroups.query({ currentWindow: true })` to `chrome.tabGroups.query({ windowId: chrome.windows.WINDOW_ID_CURRENT })`
  - Modified `tabGroups.update` to only pass defined properties, avoiding undefined values

## Chrome Web Store Compliance

This extension follows Chrome Web Store guidelines:
- Manifest V3
- Proper permissions: storage, tabs, tabGroups, host_permissions
- Secure content security policy
- No tracking or external requests
- Includes proper icons and descriptions
- Supports internationalization (i18n)

## Development

The extension uses ES modules and requires a modern browser with:
- Chrome 89+ (for tabGroups API)
- Manifest V3 support

## License

This project is a custom implementation inspired by auto-group-tabs (https://github.com/marwincn/auto-group-tabs)
