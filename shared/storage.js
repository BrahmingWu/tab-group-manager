/**
 * Helpers for chrome.storage.sync interactions
 */

import { DEFAULT_CONFIG } from './config.js';

/**
 * Load config from storage.
 * Merges with defaults for missing keys.
 * Deep merges configuration object to preserve nested defaults.
 * @returns {Promise<Config>}
 */
export async function loadConfig() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_CONFIG);
    return {
      ...DEFAULT_CONFIG,
      ...result,
      configuration: {
        ...DEFAULT_CONFIG.configuration,
        ...(result.configuration || {})
      }
    };
  } catch (error) {
    console.error('Failed to load config:', error);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save config to storage.
 * @param {Config} config - Config object to save
 * @returns {Promise<void>}
 */
export async function saveConfig(config) {
  try {
    await chrome.storage.sync.set(config);
  } catch (error) {
    console.error('Failed to save config:', error);
    throw error;
  }
}

/**
 * Get single config value.
 * @param {string} key - Config key to retrieve
 * @returns {Promise<any>}
 */
export async function getConfigKey(key) {
  try {
    const result = await chrome.storage.sync.get(key);
    return result[key];
  } catch (error) {
    console.error(`Failed to get config key "${key}":`, error);
    throw error;
  }
}

/**
 * Set single config value.
 * @param {string} key - Config key to set
 * @param {any} value - Value to set
 * @returns {Promise<void>}
 */
export async function setConfigKey(key, value) {
  try {
    await chrome.storage.sync.set({ [key]: value });
  } catch (error) {
    console.error(`Failed to set config key "${key}":`, error);
    throw error;
  }
}

/**
 * Reset config to defaults.
 * @returns {Promise<void>}
 */
export async function resetConfig() {
  try {
    await chrome.storage.sync.set(DEFAULT_CONFIG);
  } catch (error) {
    console.error('Failed to reset config:', error);
    throw error;
  }
}
