/**
 * Message dispatcher — routes incoming messages to handlers.
 * Pure routing, no business logic.
 */

import { Msg } from "../core/messaging.js";
import {
  handleGetConfig,
  handleSetConfig,
  handleToggleAutoGroup,
  handleGroupAllTabs,
  handleGroupTab,
  handleUngroupTab,
} from "./message-handlers.js";

const HANDLERS = {
  [Msg.GET_CONFIG]: handleGetConfig,
  [Msg.SET_CONFIG]: handleSetConfig,
  [Msg.TOGGLE_AUTO_GROUP]: handleToggleAutoGroup,
  [Msg.GROUP_ALL_TABS]: handleGroupAllTabs,
  [Msg.GROUP_TAB]: handleGroupTab,
  [Msg.UNGROUP_TAB]: handleUngroupTab,
};

export function setupMessageDispatcher() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    const handler = HANDLERS[message.type];

    if (!handler) {
      sendResponse({ success: false, error: `Unknown message type: ${message.type}` });
      return false;
    }

    handler(message)
      .then(sendResponse)
      .catch((error) => {
        console.error("[TabGroupManager] Message handler error:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  });
}
