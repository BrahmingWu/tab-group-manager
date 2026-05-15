/**
 * Tab event listeners — onCreated, onUpdated, onRemoved.
 */

import { store } from "../core/config-store.js";
import { executeAutoGroup } from "./auto-group.js";
import { handleTabNoLongerGroupable, checkAllGroupsForUngroup } from "./auto-ungroup.js";

export function setupTabEvents() {
  setupOnCreated();
  setupOnUpdated();
  setupOnRemoved();
}

function setupOnCreated() {
  chrome.tabs.onCreated.addListener(async (tab) => {
    console.log("[TabGroupManager] Tab created:", tab.id, tab.url);

    if (!tab.openerTabId) return;

    const config = store.config;
    if (!config.inheritParentGroup) return;

    try {
      const openerTab = await chrome.tabs.get(tab.openerTabId);

      if (openerTab.groupId === -1) {
        console.log("[TabGroupManager] Opener tab is not in a group, skipping inherit");
        return;
      }

      await chrome.tabs.group({ tabIds: [tab.id], groupId: openerTab.groupId });
      console.log(
        `[TabGroupManager] Added tab ${tab.id} to group ${openerTab.groupId} (inherited from opener ${tab.openerTabId})`,
      );
    } catch (error) {
      console.error("[TabGroupManager] Failed to inherit parent group:", error);
    }
  });
}

function setupOnUpdated() {
  chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (!changeInfo.url) return;

    console.log("[TabGroupManager] Tab updated:", tabId, "URL changed to:", changeInfo.url);

    if (!changeInfo.url.startsWith("http://") && !changeInfo.url.startsWith("https://")) {
      console.log("[TabGroupManager] Non-http URL, skipping auto-group");
      return;
    }

    if (tab.pinned) {
      console.log("[TabGroupManager] Tab is pinned, skipping auto-group");
      return;
    }

    const grouped = await executeAutoGroup(tab);

    if (!grouped && store.config.autoUngroup && tab.groupId !== -1) {
      await handleTabNoLongerGroupable(tabId, tab.groupId);
    }
  });
}

function setupOnRemoved() {
  chrome.tabs.onRemoved.addListener(async (_tabId, removeInfo) => {
    if (removeInfo.isWindowClosing) return;
    await checkAllGroupsForUngroup(removeInfo.windowId);
  });
}
