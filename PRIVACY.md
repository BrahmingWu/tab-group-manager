# Privacy Policy for Tab Group Manager Extension

**Effective Date:** [Date of Publication]

## 1. Data Collection and Storage

The Tab Group Manager extension operates entirely within your browser and **does not collect, transmit, or store any personal data to external servers**.

### Data We Store Locally:
- **User Preferences**: Your grouping strategy preferences, auto-group settings, and custom rules are stored locally using Chrome's `storage.sync` API.
- **Tab Information**: The extension analyzes tab URLs only to determine grouping based on domains or patterns. Tab content is never accessed or transmitted.

### Data We Do NOT Collect:
- Personal identification information
- Browsing history
- Tab contents or page data
- Cookies or login credentials
- Any data transmitted to external servers

## 2. Permissions Usage

The extension requests the following permissions:

- **`storage`**: Used to save your preferences and custom rules locally in your browser.
- **`tabs`**: Used to read tab URLs for grouping purposes and to organize tabs into groups.
- **`tabGroups`**: Used to create, modify, and organize tab groups.

## 3. Third-Party Services

This extension **does not use**:
- Third-party analytics or tracking services
- External servers or APIs
- Advertising networks

## 4. Data Retention

All data is stored locally on your device using Chrome's storage API. Data is:
- Deleted when you uninstall the extension
- Not accessible by the extension developer
- Never synced to external servers

## 5. Data Access and Export

You can:
- View and modify your settings in the extension options page
- Export your custom rules (stored as a local JSON file)
- Reset all settings to defaults
- Uninstall the extension to remove all stored data

## 6. Security

- All data remains on your device
- No data is transmitted over the internet
- The extension follows Chrome Extension security best practices
- Source code is available for review

## 7. Children's Privacy

This service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.

## 8. Changes to This Privacy Policy

We may update our privacy policy from time to time. Changes will be posted on this page with an updated revision date.

## 9. Contact

For questions about this privacy policy or the extension's data practices, please:
- Open an issue on the extension's repository (if available)
- Contact the developer through Chrome Web Store

---

## For Chrome Web Store Submission

**IMPORTANT**: When submitting this extension to the Chrome Web Store, you must:

1. **Host this Privacy Policy** - Upload this file to a publicly accessible URL (e.g., GitHub Pages, personal website)
2. **Update manifest.json** - Add a `"privacy_policy_url"` field (Chrome Web Store may not support this in manifest, so include the URL in your extension description instead)
3. **Include URL in Description** - Add "Privacy Policy: [YOUR_URL]" to the extension description or store listing

### Recommended Privacy Policy Hosting Options:
- **GitHub Pages**: Create a repository, upload this file as `PRIVACY.md`, enable GitHub Pages
- **GitHub Gist**: Create a public gist with this content and use the gist's raw URL
- **Personal Website**: Upload to your own domain

### Example Description Update:
```
Privacy Policy: https://yourname.github.io/tab-group-manager/privacy.html
```
