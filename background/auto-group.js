/**
 * Auto-group orchestrator — executed when a tab URL changes.
 */

import { store } from "../core/config-store.js";
import { resolveStrategy } from "../domain/strategy-resolver.js";
import { createGroup } from "./group-ops.js";

export async function executeAutoGroup(tab) {
  const config = store.config;

  if (!config.enableAutoGroup) return;
  if (tab.pinned) return;
  if (!tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) return;

  const strategy = resolveStrategy(config);

  if (!strategy.shouldGroup(null, tab)) {
    console.log("[TabGroupManager] Tab does not meet shouldGroup criteria, skipping");
    return;
  }

  const groupTitle = strategy.getGroupTitle(tab);
  const groupColor = strategy.getGroupColor(tab);

  if (!groupTitle) {
    console.log("[TabGroupManager] No group title determined, skipping");
    return;
  }

  const sameTabs = await strategy.querySameTabs(tab);
  const totalTabs = [tab, ...sameTabs];

  console.log("[TabGroupManager] Total tabs to group:", totalTabs.length, "threshold:", config.groupTabNum);

  if (totalTabs.length < config.groupTabNum) {
    console.log("[TabGroupManager] Below threshold, not grouping");
    return false;
  }

  try {
    const allGroups = await chrome.tabGroups.query({
      windowId: chrome.windows.WINDOW_ID_CURRENT,
    });
    const existingGroup = allGroups.find((g) => g.title === groupTitle);

    if (existingGroup) {
      console.log("[TabGroupManager] Found existing group:", existingGroup.id);
      const otherTabIds = totalTabs.slice(1).map((t) => t.id);
      if (otherTabIds.length > 0) {
        await chrome.tabs.group({ tabIds: otherTabIds, groupId: existingGroup.id });
        console.log(`[TabGroupManager] Added ${otherTabIds.length} tabs to existing group ${existingGroup.id}`);
      }
    } else {
      await createGroup(totalTabs, groupTitle, groupColor, -1);
    }
    return true;
  } catch (error) {
    console.error("[TabGroupManager] Error checking/creating group:", error);
    await createGroup(totalTabs, groupTitle, groupColor, -1);
    return true;
  }
}
