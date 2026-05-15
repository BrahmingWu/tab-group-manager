export const Msg = Object.freeze({
  GET_CONFIG: "GET_CONFIG",
  SET_CONFIG: "SET_CONFIG",
  TOGGLE_AUTO_GROUP: "TOGGLE_AUTO_GROUP",
  GROUP_ALL_TABS: "GROUP_ALL_TABS",
  GROUP_TAB: "GROUP_TAB",
  UNGROUP_TAB: "UNGROUP_TAB",
});

/**
 * Send a message to the service worker.
 * Shared wrapper used by both popup and options.
 * @param {object} message
 * @returns {Promise<any>}
 */
export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
