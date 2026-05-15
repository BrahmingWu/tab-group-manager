/**
 * Raw chrome.storage.sync wrappers — no config knowledge.
 */

/**
 * Get all values from storage.
 * @param {object} keys - Default keys to merge
 * @returns {Promise<object>}
 */
export async function storageGet(keys) {
  try {
    return await chrome.storage.sync.get(keys);
  } catch (error) {
    console.error("Failed to read storage:", error);
    return {};
  }
}

/**
 * Set values to storage.
 * @param {object} items
 * @returns {Promise<void>}
 */
export async function storageSet(items) {
  try {
    await chrome.storage.sync.set(items);
  } catch (error) {
    console.error("Failed to write storage:", error);
    throw error;
  }
}

/**
 * Get a single key from storage.
 * @param {string} key
 * @returns {Promise<any>}
 */
export async function storageGetKey(key) {
  try {
    const result = await chrome.storage.sync.get(key);
    return result[key];
  } catch (error) {
    console.error(`Failed to get key "${key}":`, error);
    throw error;
  }
}

/**
 * Set a single key in storage.
 * @param {string} key
 * @param {any} value
 * @returns {Promise<void>}
 */
export async function storageSetKey(key, value) {
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch (error) {
    console.error(`Failed to set key "${key}":`, error);
    throw error;
  }
}
