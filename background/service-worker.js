/**
 * Service Worker entry point for Tab Group Manager (Manifest V3).
 */

import { store } from "../core/config-store.js";
import { setupTabEvents } from "./tab-events.js";
import { setupMessageDispatcher } from "./message-dispatcher.js";
import { setupCommands } from "./commands.js";

// Top-level await is not supported in Chrome extension service workers.
// Use self-invoking async function instead.
(async () => {
  await store.init();
  setupTabEvents();
  setupMessageDispatcher();
  setupCommands();
  console.log("[TabGroupManager] Service worker initialized");
})();
