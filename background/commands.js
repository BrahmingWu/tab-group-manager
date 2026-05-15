/**
 * Keyboard command handlers.
 */

import { store } from "../core/config-store.js";
import { resolveStrategy } from "../domain/strategy-resolver.js";
import { createGroup } from "./group-ops.js";

export function setupCommands() {
  chrome.commands.onCommand.addListener(async (command) => {
    console.log("[TabGroupManager] Command received:", command);

    switch (command) {
      case "toggle-auto-group": {
        const newValue = !store.config.enableAutoGroup;
        await store.setKey("enableAutoGroup", newValue);
        console.log("[TabGroupManager] Auto-group toggled via command to:", newValue);
        break;
      }

      case "group-current-tab": {
        const config = store.config;
        const strategy = resolveStrategy(config);

        const [currentTab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!currentTab) break;

        if (
          !currentTab.url ||
          (!currentTab.url.startsWith("http://") && !currentTab.url.startsWith("https://"))
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
        await createGroup(totalTabs, groupTitle, groupColor, -1);
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
}
