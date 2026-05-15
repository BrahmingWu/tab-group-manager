/**
 * Message handlers — one function per message type.
 */

import { store } from "../core/config-store.js";
import { resolveStrategy } from "../domain/strategy-resolver.js";
import { createGroup } from "./group-ops.js";

export async function handleGetConfig() {
  return { success: true, config: store.config };
}

export async function handleSetConfig({ config }) {
  await store.update(config);
  return { success: true };
}

export async function handleToggleAutoGroup() {
  const newValue = !store.config.enableAutoGroup;
  await store.setKey("enableAutoGroup", newValue);
  console.log("[TabGroupManager] Auto-group toggled to:", newValue);
  return { success: true, enableAutoGroup: newValue };
}

export async function handleGroupAllTabs() {
  const config = store.config;
  const strategy = resolveStrategy(config);

  const allTabs = await chrome.tabs.query({ currentWindow: true });

  const eligibleTabs = allTabs.filter((t) => {
    if (t.pinned) return false;
    if (!t.url || (!t.url.startsWith("http://") && !t.url.startsWith("https://"))) return false;
    return true;
  });

  const groups = new Map();
  for (const tab of eligibleTabs) {
    const groupKey = strategy.getGroupKey(tab);
    if (!groupKey) continue;

    const groupTitle = strategy.getGroupTitle(tab);
    const groupColor = strategy.getGroupColor(tab);

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { title: groupTitle, color: groupColor, tabs: [] });
    }
    groups.get(groupKey).tabs.push(tab);
  }

  let groupsCreated = 0;
  for (const [, group] of groups) {
    if (group.tabs.length >= config.groupTabNum) {
      await createGroup(group.tabs, group.title, group.color, -1);
      groupsCreated++;
    }
  }

  console.log(`[TabGroupManager] Grouped tabs into ${groupsCreated} groups`);
  return { success: true, groupsCreated };
}

export async function handleGroupTab({ tabId }) {
  const config = store.config;
  const strategy = resolveStrategy(config);

  const tab = await chrome.tabs.get(tabId);
  if (!tab || !tab.url || (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))) {
    return { success: false, error: "Invalid tab or URL" };
  }

  const sameTabs = await strategy.querySameTabs(tab);
  const totalTabs = [tab, ...sameTabs];

  if (totalTabs.length < config.groupTabNum) {
    return {
      success: false,
      error: `Need ${config.groupTabNum} tabs to form a group, found ${totalTabs.length}`,
    };
  }

  const groupTitle = strategy.getGroupTitle(tab);
  const groupColor = strategy.getGroupColor(tab);

  const groupId = await createGroup(totalTabs, groupTitle, groupColor, -1);
  return { success: true, groupId };
}

export async function handleUngroupTab({ tabId }) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab.groupId !== -1) {
      await chrome.tabs.ungroup(tabId);
      console.log(`[TabGroupManager] Ungrouped tab ${tabId}`);
      return { success: true };
    }
    return { success: false, error: "Tab is not in a group" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
