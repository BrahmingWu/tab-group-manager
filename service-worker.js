/**
 * Service Worker for Tab Group Manager (Manifest V3)
 * Handles auto-grouping, parent group inheritance, and popup/options communication.
 */

import { loadConfig, saveConfig, setConfigKey } from "./shared/storage.js";
import { STRATEGY_MAP, getFallbackStrategy } from "./shared/strategies.js";

/**
 * Get appropriate strategy based on config (supports multiple strategies with priority)
 * @param {object} config - Full config object
 * @returns {object|object[]} Strategy object or array of strategies
 */
function getStrategy(config) {
  const strategies = config.groupStrategy || [1];
  if (strategies.length === 1) {
    return STRATEGY_MAP[strategies[0]] || STRATEGY_MAP[1];
  }
  return strategies.map((s) => STRATEGY_MAP[s]).filter((s) => s);
}

/**
 * Create a strategy wrapper that applies fallback logic and supports multiple strategies
 * @param {object} config - Full config object
 * @returns {object} Wrapped strategy with fallback and multiple strategies applied
 */
function getStrategyWithFallback(config) {
  const strategies = config.groupStrategy || [1];

  if (strategies.length === 1) {
    const strategy = STRATEGY_MAP[strategies[0]] || STRATEGY_MAP[1];
    const fallbackStrategy = getFallbackStrategy(
      config.configuration?.fallback || "none",
    );

    // Only return raw strategy for non-custom strategies
    // Custom strategy (3) always needs wrapping to inject config parameter
    // if (strategies[0] !== 3) {
    //   return strategy;
    // }
    if (strategies[0] === 3) {
      return {
        shouldGroup(changeInfo, tab) {
          return strategy.shouldGroup(changeInfo, tab);
        },

        getGroupTitle(tab) {
          const customTitle = strategy.getGroupTitle(tab, config);
          if (customTitle) return customTitle;
          return fallbackStrategy.getGroupTitle(tab);
        },

        getGroupColor(tab) {
          const customColor = strategy.getGroupColor(tab, config);
          if (customColor) return customColor;
          return fallbackStrategy.getGroupColor(tab);
        },

        async querySameTabs(tab) {
          const customTitle = strategy.getGroupTitle(tab, config);
          const fallbackTitle = fallbackStrategy.getGroupTitle(tab);

          if (!customTitle && !fallbackTitle) return [];
          const allTabs = await chrome.tabs.query({ currentWindow: true });
          return allTabs.filter((t) => {
            if (t.id === tab.id || t.pinned) return false;

            const tCustomTitle = strategy.getGroupTitle(t, config);
            const tFallbackTitle = fallbackStrategy.getGroupTitle(t);

            return (
              tCustomTitle === customTitle || tFallbackTitle === fallbackTitle
            );
          });
        },

        getGroupKey(tab) {
          const customKey = strategy.getGroupKey(tab, config);
          if (customKey) return customKey;
          return fallbackStrategy.getGroupKey(tab);
        },
      };
    } else {
      // Wrap strategy 1 or 2 to pass config to every method
      return {
        shouldGroup: (changeInfo, tab) => strategy.shouldGroup(changeInfo, tab),
        getGroupTitle: (tab) => strategy.getGroupTitle(tab, config),
        getGroupColor: (tab) => strategy.getGroupColor(tab, config),
        getGroupKey: (tab) => strategy.getGroupKey(tab, config),
        querySameTabs: (tab) => strategy.querySameTabs(tab, config),
      };
    }
  }

  const strategyList = strategies.map((s) => STRATEGY_MAP[s]).filter((s) => s);
  const fallbackStrategy = getFallbackStrategy(
    config.configuration?.fallback || "none",
  );

  return {
    shouldGroup(changeInfo, tab) {
      return strategyList.some((s) => s.shouldGroup(changeInfo, tab));
    },

    getGroupTitle(tab) {
      for (const strategy of strategyList) {
        const title = strategy.getGroupTitle(tab, config);
        if (title) return title;
      }
      return fallbackStrategy.getGroupTitle(tab);
    },

    getGroupColor(tab) {
      for (const strategy of strategyList) {
        const color = strategy.getGroupColor(tab, config);
        if (color) return color;
      }
      return fallbackStrategy.getGroupColor(tab);
    },

    async querySameTabs(tab) {
      const groupKey = this.getGroupKey(tab);
      if (!groupKey) return [];

      const allTabs = await chrome.tabs.query({ currentWindow: true });
      return allTabs.filter((t) => {
        if (t.id === tab.id || t.pinned) return false;
        return this.getGroupKey(t) === groupKey;
      });
    },

    getGroupKey(tab) {
      for (const strategy of strategyList) {
        const key = strategy.getGroupKey(tab, config);
        if (key) return key;
      }
      return fallbackStrategy.getGroupKey(tab);
    },
  };
}
/**
 * Add tabs to an existing group or create a new one
 * @param {Array<chrome.tabs.Tab>} tabs - Tabs to group
 * @param {string} groupTitle - Title for the group
 * @param {string|null} groupColor - Color for the group (optional)
 * @param {number} existingGroupId - Existing group ID to use, or -1
 * @returns {Promise<number>} The group ID
 */
async function addTabsToGroup(
  tabs,
  groupTitle,
  groupColor,
  existingGroupId = -1,
) {
  if (tabs.length === 0) return -1;

  let targetGroupId = existingGroupId;

  // If no existing group, create one with the first tab
  if (targetGroupId === -1) {
    const firstTab = tabs[0];
    try {
      targetGroupId = await chrome.tabs.group({ tabIds: [firstTab.id] });
      console.log(
        `[TabGroupManager] Created new group ${targetGroupId} for "${groupTitle}"`,
      );

      // Update group properties
      const updateProps = {};
      if (groupTitle) {
        updateProps.title = groupTitle;
      }
      if (groupColor) {
        updateProps.color = groupColor;
      }
      if (Object.keys(updateProps).length > 0) {
        await chrome.tabGroups.update(targetGroupId, updateProps);
      }
    } catch (error) {
      console.error("[TabGroupManager] Failed to create group:", error);
      return -1;
    }
  }

  // Add remaining tabs to the group
  if (tabs.length > 1) {
    const otherTabIds = tabs.slice(1).map((t) => t.id);
    try {
      await chrome.tabs.group({ tabIds: otherTabIds, groupId: targetGroupId });
      console.log(
        `[TabGroupManager] Added ${tabs.length - 1} more tabs to group ${targetGroupId}`,
      );
    } catch (error) {
      console.error("[TabGroupManager] Failed to add tabs to group:", error);
    }
  }

  return targetGroupId;
}

/**
 * Handle tab creation - inherit parent group if enabled
 */
chrome.tabs.onCreated.addListener(async (tab) => {
  console.log("[TabGroupManager] Tab created:", tab.id, tab.url);

  // Skip if no opener
  if (!tab.openerTabId) return;

  // Load config (service worker may have been terminated)
  const config = await loadConfig();

  // Check if inherit parent group is enabled
  if (!config.inheritParentGroup) return;

  try {
    // Get the opener tab
    const openerTab = await chrome.tabs.get(tab.openerTabId);

    // Check if opener is in a group
    if (openerTab.groupId === -1) {
      console.log(
        "[TabGroupManager] Opener tab is not in a group, skipping inherit",
      );
      return;
    }

    // Add new tab to the opener's group
    await chrome.tabs.group({ tabIds: [tab.id], groupId: openerTab.groupId });
    console.log(
      `[TabGroupManager] Added tab ${tab.id} to group ${openerTab.groupId} (inherited from opener ${tab.openerTabId})`,
    );
  } catch (error) {
    console.error("[TabGroupManager] Failed to inherit parent group:", error);
  }
});

/**
 * Handle tab updates - auto-group based on URL changes
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act on URL changes
  if (!changeInfo.url) return;

  console.log(
    "[TabGroupManager] Tab updated:",
    tabId,
    "URL changed to:",
    changeInfo.url,
  );

  // Skip non-http URLs (ungroup from any group)
  if (
    !changeInfo.url.startsWith("http://") &&
    !changeInfo.url.startsWith("https://")
  ) {
    console.log("[TabGroupManager] Non-http URL, skipping auto-group");
    return;
  }

  // Skip pinned tabs
  if (tab.pinned) {
    console.log("[TabGroupManager] Tab is pinned, skipping auto-group");
    return;
  }

  // Load config (service worker may have been terminated)
  const config = await loadConfig();

  // Check if auto-group is enabled
  if (!config.enableAutoGroup) {
    console.log("[TabGroupManager] Auto-group is disabled, skipping");
    return;
  }

  // Get the appropriate strategy
  const strategy = getStrategyWithFallback(config);

  // Check if this tab should be grouped
  if (!strategy.shouldGroup(changeInfo, tab)) {
    console.log(
      "[TabGroupManager] Tab does not meet shouldGroup criteria, skipping",
    );
    return;
  }

  // Get group title for this tab
  const groupTitle = strategy.getGroupTitle(tab);
  const groupColor = strategy.getGroupColor(tab);
  console.log(
    "[TabGroupManager] Group title:",
    groupTitle,
    "color:",
    groupColor,
  );

  if (!groupTitle) {
    console.log("[TabGroupManager] No group title determined, skipping");
    return;
  }

  // Query same tabs using strategy
  const sameTabs = await strategy.querySameTabs(tab);
  console.log("[TabGroupManager] Found", sameTabs.length, "same tabs");

  // Include the current tab in count
  const totalTabs = [tab, ...sameTabs];
  console.log(
    "[TabGroupManager] Total tabs to group:",
    totalTabs.length,
    "threshold:",
    config.groupTabNum,
  );

  // Check threshold
  if (totalTabs.length < config.groupTabNum) {
    console.log("[TabGroupManager] Below threshold, not grouping");
    return;
  }

  // Check if a group already exists for this title
  try {
    // Query all groups in current window, then filter by title
    // Note: chrome.tabGroups.query does NOT support 'title' parameter in queryInfo
    const allGroups = await chrome.tabGroups.query({
      windowId: chrome.windows.WINDOW_ID_CURRENT,
    });
    const existingGroup = allGroups.find((g) => g.title === groupTitle);

    if (existingGroup) {
      console.log("[TabGroupManager] Found existing group:", existingGroup.id);
      // Add tabs to existing group (exclude first tab since it's already in the group, and other tabs already in this or other groups)
      const otherTabIds = totalTabs.slice(1).map((t) => t.id);
      if (otherTabIds.length > 0) {
        try {
          await chrome.tabs.group({
            tabIds: otherTabIds,
            groupId: existingGroup.id,
          });
          console.log(
            `[TabGroupManager] Added ${otherTabIds.length} tabs to existing group ${existingGroup.id}`,
          );
        } catch (error) {
          console.error(
            "[TabGroupManager] Failed to add tabs to existing group:",
            error,
          );
        }
      }
    } else {
      // Create new group
      await addTabsToGroup(totalTabs, groupTitle, groupColor, -1);
    }
  } catch (error) {
    console.error("[TabGroupManager] Error checking/creating group:", error);
    // Try to create group anyway
    await addTabsToGroup(totalTabs, groupTitle, groupColor, -1);
  }
});

/**
 * Handle messages from popup/options
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[TabGroupManager] Received message:", message.type);

  // Handle async operations
  const handleAsync = async () => {
    switch (message.type) {
      case "GET_CONFIG": {
        const config = await loadConfig();
        return { success: true, config };
      }

      case "SET_CONFIG": {
        const { config } = message;
        await saveConfig(config);
        return { success: true };
      }

      case "TOGGLE_AUTO_GROUP": {
        const config = await loadConfig();
        const newValue = !config.enableAutoGroup;
        await setConfigKey("enableAutoGroup", newValue);
        console.log("[TabGroupManager] Auto-group toggled to:", newValue);
        return { success: true, enableAutoGroup: newValue };
      }

      case "GROUP_ALL_TABS": {
        const config = await loadConfig();
        const strategy = getStrategyWithFallback(config);

        // Query all tabs in current window
        const allTabs = await chrome.tabs.query({ currentWindow: true });

        // Filter out pinned tabs and invalid URLs
        const eligibleTabs = allTabs.filter((t) => {
          if (t.pinned) return false;
          if (
            !t.url ||
            (!t.url.startsWith("http://") && !t.url.startsWith("https://"))
          )
            return false;
          return true;
        });

        // Group by strategy's getGroupKey
        const groups = new Map();
        for (const tab of eligibleTabs) {
          const groupKey = strategy.getGroupKey(tab);
          if (!groupKey) continue;

          const groupTitle = strategy.getGroupTitle(tab);
          const groupColor = strategy.getGroupColor(tab);

          if (!groups.has(groupKey)) {
            groups.set(groupKey, {
              title: groupTitle,
              color: groupColor,
              tabs: [],
            });
          }
          groups.get(groupKey).tabs.push(tab);
        }

        // Create groups for those meeting threshold
        let groupsCreated = 0;
        for (const [key, group] of groups) {
          if (group.tabs.length >= config.groupTabNum) {
            await addTabsToGroup(group.tabs, group.title, group.color, -1);
            groupsCreated++;
          }
        }

        console.log(
          `[TabGroupManager] Grouped tabs into ${groupsCreated} groups`,
        );
        return { success: true, groupsCreated };
      }

      case "GROUP_TAB": {
        const { tabId } = message;
        const config = await loadConfig();
        const strategy = getStrategyWithFallback(config);

        const tab = await chrome.tabs.get(tabId);
        if (
          !tab ||
          !tab.url ||
          (!tab.url.startsWith("http://") && !tab.url.startsWith("https://"))
        ) {
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

        const groupId = await addTabsToGroup(
          totalTabs,
          groupTitle,
          groupColor,
          -1,
        );
        return { success: true, groupId };
      }

      case "UNGROUP_TAB": {
        const { tabId } = message;
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

      default:
        return { success: false, error: "Unknown message type" };
    }
  };

  handleAsync()
    .then((result) => sendResponse(result))
    .catch((error) => {
      console.error("[TabGroupManager] Message handler error:", error);
      sendResponse({ success: false, error: error.message });
    });

  // Return true to indicate async response
  return true;
});

/**
 * Handle keyboard commands
 */
chrome.commands.onCommand.addListener(async (command) => {
  console.log("[TabGroupManager] Command received:", command);

  switch (command) {
    case "toggle-auto-group": {
      const config = await loadConfig();
      const newValue = !config.enableAutoGroup;
      await setConfigKey("enableAutoGroup", newValue);
      console.log(
        "[TabGroupManager] Auto-group toggled via command to:",
        newValue,
      );
      break;
    }

    case "group-current-tab": {
      const config = await loadConfig();
      const strategy = getStrategyWithFallback(config);

      const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!currentTab) break;

      if (
        !currentTab.url ||
        (!currentTab.url.startsWith("http://") &&
          !currentTab.url.startsWith("https://"))
      ) {
        console.log("[TabGroupManager] Current tab has invalid URL");
        break;
      }

      const sameTabs = await strategy.querySameTabs(currentTab);
      const totalTabs = [currentTab, ...sameTabs];

      if (totalTabs.length < config.groupTabNum) {
        console.log(
          `[TabGroupManager] Need ${config.groupTabNum} tabs, found ${totalTabs.length}`,
        );
        break;
      }

      const groupTitle = strategy.getGroupTitle(currentTab);
      const groupColor = strategy.getGroupColor(currentTab);
      await addTabsToGroup(totalTabs, groupTitle, groupColor, -1);
      console.log("[TabGroupManager] Grouped current tab via command");
      break;
    }

    case "ungroup-current-tab": {
      const [currentTab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (currentTab && currentTab.groupId !== -1) {
        await chrome.tabs.ungroup(currentTab.id);
        console.log("[TabGroupManager] Ungrouped current tab via command");
      }
      break;
    }

    default:
      console.log("[TabGroupManager] Unknown command:", command);
  }
});

console.log("[TabGroupManager] Service worker initialized");

