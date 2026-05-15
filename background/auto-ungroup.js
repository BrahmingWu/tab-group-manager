/**
 * Auto-ungroup logic — checks if a group should be ungrouped.
 */

import { store } from "../core/config-store.js";
import { ungroupIfBelowThreshold } from "./group-ops.js";

/**
 * Handle tab that no longer matches its group — ungroup it and
 * check if remaining tabs in the old group still meet threshold.
 * Called from onUpdated when threshold isn't met.
 */
export async function handleTabNoLongerGroupable(tabId, oldGroupId) {
  const config = store.config;

  if (!config.autoUngroup) return;

  try {
    await chrome.tabs.ungroup(tabId);
    console.log(`[TabGroupManager] Ungrouped tab ${tabId} from group ${oldGroupId} (URL changed)`);

    await ungroupIfBelowThreshold(oldGroupId, config.groupTabNum);
  } catch (error) {
    console.error("[TabGroupManager] Auto-ungroup error:", error);
  }
}

/**
 * Check all groups in a window and ungroup any below threshold.
 * Called from onRemoved.
 */
export async function checkAllGroupsForUngroup(windowId) {
  const config = store.config;

  if (!config.enableAutoGroup || !config.autoUngroup) return;

  try {
    const allGroups = await chrome.tabGroups.query({ windowId });

    for (const group of allGroups) {
      await ungroupIfBelowThreshold(group.id, config.groupTabNum);
    }
  } catch (error) {
    console.error("[TabGroupManager] checkAllGroupsForUngroup error:", error);
  }
}
