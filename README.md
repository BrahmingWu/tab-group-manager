# Tab Group Manager

Automatically organize your Chrome tabs into groups by domain, secondary domain, or custom rules. No bloat, no tracking, pure vanilla JS.

> Manifest V3 · v1.1.0

## Installation

### Chrome Web Store

[Available on Chrome Web Store](#) <!-- TODO: add link after publishing -->

### Manual (Developer Mode)

1. Download the [latest release ZIP](https://github.com/brahmingwu/tab-group-manager/releases) and unzip
2. Go to `chrome://extensions`, enable **Developer mode** (top right)
3. Click **Load unpacked** → select the unzipped folder

> No build step, no dependencies. Edit the source directly and reload.

## Features

### Smart Auto-Grouping

Tabs are automatically grouped when their URLs change. You control when it triggers:

- **Domain** — Group by full hostname (`github.com`, `gitlab.com`)
- **Secondary Domain** — Group by registered domain only (`github.com` from `user.github.com`, `images.github.com`)
- **Custom Rules** — Match by domain pattern, URL regex, or both. Assign custom group titles and colors

Strategies are tried in priority order (drag to reorder in settings). Custom rules include a configurable fallback (off / domain / secondary domain) when no rule matches.

### Threshold Control

Set a minimum tab count (`groupTabNum`). Groups only form when enough matching tabs exist. Includes **Auto Ungroup** — when tabs in a group fall below the threshold (tab closed, URL changed), the group is automatically dissolved.

### Parent Group Inheritance

When you open a link from a grouped tab (click, context menu), the new tab automatically joins the parent group. Configurable on/off.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+G` | Toggle auto-grouping |
| `Alt+Shift+T` | Group current tab |
| `Alt+Shift+U` | Ungroup current tab |

### Popup Controls

Click the extension icon for quick access:
- Toggle auto-grouping on/off
- See current strategy
- **Group All Tabs Now** — one-click batch grouping of every tab in the window

### Import / Export

Backup your custom rules as JSON, share between devices, or version-control your configuration.

---

## Roadmap

Planned features in rough priority order.

### Per-Strategy Controls

Currently auto-grouping is a single global toggle. Future: independent enable/disable and ungroup behavior per strategy. Example: run domain grouping automatically but only use custom rules on manual trigger.

### Strategy Restructure

Decouple strategy selection from the auto-group pipeline. Allow strategies to be used independently — run one for auto-grouping, another for manual grouping, etc.

### Smarter Inheritance

Cmd+T / Ctrl+T opens a new tab. Currently this inherits nothing. Future: inherit the parent group when opening a new tab from a grouped one, matching the same behavior as link-clicks.

### Window-Aware Groups

Group scoping by window. Currently groups operate window-wide; future: optional cross-window awareness, window-close cleanup hooks, per-window strategy configuration.

### Sub-Groups / Nested Groups

Parent-child group relationships. Example: `github.com` as a parent group, with PR pages and issue pages as sub-groups inheriting the parent color but with distinct names.

### Rule Templates & Presets

Pre-built rule sets for common workflows (dev tools, social media, news, work apps). One-click import from a preset library.

### Statistics & Insights

Track how many tabs you've grouped, most common domains, time saved. Optional, local-only, zero telemetry.

---

## Architecture

```
core/         → Framework (ConfigStore, messaging, constants, storage)
domain/       → Business logic (strategies, resolver, rule engine, utils)
background/   → Chrome API consumers (events, grouping, ungrouping, commands)
popup/        → Extension popup UI
options/      → Settings page UI
```

Layer rules: `core/` shared by all layers. `domain/` pure functions (Chrome API only in `querySameTabs`). `background/` consumes Chrome APIs. UI communicates via `chrome.runtime.sendMessage`.

See [AGENTS.md](./AGENTS.md) for full architecture docs.

## Development

```bash
git clone https://github.com/brahmingwu/tab-group-manager.git
cd tab-group-manager
# Load unpacked from chrome://extensions — no build step required
```

- **Zero dependencies** — pure vanilla JS, ES modules
- **No build step** — edit files directly, reload extension to test
- **Config in `chrome.storage.sync`** — survives service worker restarts, syncs across devices
- **i18n-ready** — all user-visible manifest strings in `_locales/en/messages.json`

## Contributing

Bug reports and feature requests welcome via GitHub Issues. PRs should follow the layer conventions documented in [AGENTS.md](./AGENTS.md).
