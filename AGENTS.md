# AGENTS.md — Tab Group Manager

Chrome extension (Manifest V3) that auto-groups tabs by domain/custom rules. Pure vanilla JS, no build step, no dependencies, no tests.

## Architecture

```
manifest.json        → MV3, type:"module" service worker, default_locale:"en"
service-worker.js    → background: auto-group, inherit parent group, message router, keyboard commands
popup/               → popup UI (toggle + "Group All" button)
options.{html,js,css}→ full settings page: strategies, custom rules, import/export
shared/              → imported by service worker (ES module), NOT by popup/options directly
  config.js          → DEFAULT_CONFIG, validateConfig()
  storage.js         → loadConfig/saveConfig (chrome.storage.sync, deep-merges nested `configuration`)
  strategies.js      → domainStrategy, secDomainStrategy, customStrategy + STRATEGY_MAP
  configuration.js   → rule matching for custom strategy
  utils.js           → getDomain(), getSecDomain() with country-code TLD handling
_locales/en/         → i18n strings referenced via __MSG_*__ in manifest
```

## Communication

All UI ↔ service worker communication is via `chrome.runtime.sendMessage`. Both `options.js` and `popup/popup.js` define their own `sendMessage()` wrapper (callback → Promise). Message types: `GET_CONFIG`, `SET_CONFIG`, `TOGGLE_AUTO_GROUP`, `GROUP_ALL_TABS`, `GROUP_TAB`, `UNGROUP_TAB`.

## Key Conventions

- **Pure vanilla JS with ES modules**: service worker uses `import`/`export` (manifest has `"type": "module"`). Popup and options load JS via `<script type="module">`.
- **Config shape** (chrome.storage.sync):
  ```js
  { enableAutoGroup: bool, groupTabNum: number, groupStrategy: number[], inheritParentGroup: bool, configuration: { fallback: "none"|"domain"|"secDomain", rules: [...] } }
  ```
- **Strategy IDs are numbers**: 1=Domain, 2=Secondary Domain, 3=Custom Rules. Not strings.
- **DEFAULT_CONFIG** is in `shared/config.js`. `options.js` resetConfig() duplicates it (hardcoded) — update both if defaults change.
- **`STRATEGY_LABELS`** is duplicated in both `options.js` and `popup/popup.js`.
- **Config load deep-merges**: `loadConfig()` spreads `DEFAULT_CONFIG` then deep-merges `configuration` sub-object, so missing nested keys get defaults.
- **Fallback strategy** only applies when Custom Rules (strategy 3) is selected and returns null for a tab.
- **`onUpdated` listener** uses `changeInfo.url` (not `tab.url`) for the new URL. The `tab` parameter may have stale data.
- **`.sisyphus/` is git-ignored** — safe to store plans there.

## Gotchas

- **No build step**: Edit JS/CSS/HTML directly. There is no bundler, no package.json, no node_modules.
- **No tests exist**. Add any new tests under a `tests/` or `__tests__/` directory — `coverage/` and `.nyc_output/` are git-ignored.
- **chrome.tabGroups.query does NOT support `title` filter** — the service worker queries all groups and filters by `.title` manually.
- **Tab group colors** are limited to Chrome's built-ins: grey, blue, red, yellow, green, pink, purple, cyan, orange.
- **Service worker may terminate** — every event listener reloads config from `chrome.storage.sync`. Do not assume in-memory state persists.
- **i18n**: All user-visible strings in manifest use `__MSG_*__`. New strings go in `_locales/en/messages.json`.

## Commands

```bash
# Load the extension in Chrome:
#   1. Go to chrome://extensions
#   2. Enable "Developer mode"
#   3. Click "Load unpacked" → select repo root
#
# No npm/pnpm/yarn commands — no build tooling.
```
