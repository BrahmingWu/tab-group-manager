/**
 * Group management operations.
 * Wraps chrome.tabs.group / chrome.tabs.ungroup Chrome APIs.
 */

/**
 * Create a new group from tabs and update its title/color.
 * @param {chrome.tabs.Tab[]} tabs - Tabs to group
 * @param {string} groupTitle
 * @param {string|null} groupColor
 * @param {number} [existingGroupId=-1] - Existing group to merge into
 * @returns {Promise<number>} The group ID
 */
export async function createGroup(tabs, groupTitle, groupColor, existingGroupId = -1) {
  if (tabs.length === 0) return -1;

  let targetGroupId = existingGroupId;

  if (targetGroupId === -1) {
    const firstTab = tabs[0];
    try {
      targetGroupId = await chrome.tabs.group({ tabIds: [firstTab.id] });
      console.log(
        `[TabGroupManager] Created new group ${targetGroupId} for "${groupTitle}"`,
      );

      const updateProps = {};
      if (groupTitle) updateProps.title = groupTitle;
      if (groupColor) updateProps.color = groupColor;
      if (Object.keys(updateProps).length > 0) {
        await chrome.tabGroups.update(targetGroupId, updateProps);
      }
    } catch (error) {
      console.error("[TabGroupManager] Failed to create group:", error);
      return -1;
    }
  }

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
 * Ungroup all tabs in a group if its size is below the threshold.
 * @param {number} groupId
 * @param {number} threshold
 * @returns {Promise<boolean>} true if ungrouped, false otherwise
 */
export async function ungroupIfBelowThreshold(groupId, threshold) {
  try {
    const tabs = await chrome.tabs.query({ groupId });
    if (tabs.length > 0 && tabs.length < threshold) {
      await chrome.tabs.ungroup(tabs.map((t) => t.id));
      console.log(
        `[TabGroupManager] Auto-ungrouped group ${groupId}: ${tabs.length} tabs below threshold ${threshold}`,
      );
      return true;
    }
  } catch (error) {
    console.error("[TabGroupManager] ungroupIfBelowThreshold error:", error);
  }
  return false;
}
