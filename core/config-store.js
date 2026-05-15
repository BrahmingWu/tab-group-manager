/**
 * ConfigStore — singleton for sync config access.
 * Init once at startup, then read synchronously.
 */

import { storageGet, storageSet, storageSetKey } from "./storage.js";
import { DEFAULT_CONFIG } from "../domain/config.js";

class ConfigStore {
  // Seed with defaults so synchronous reads never return null,
  // even before init() completes (init is async, events may fire early).
  #config = { ...DEFAULT_CONFIG };
  #listeners = new Set();

  /**
   * Load config from storage. Call once at service worker startup.
   * Deep-merges configuration sub-object to preserve nested defaults.
   */
  async init() {
    const result = await storageGet(DEFAULT_CONFIG);
    this.#config = {
      ...DEFAULT_CONFIG,
      ...result,
      configuration: {
        ...DEFAULT_CONFIG.configuration,
        ...(result.configuration || {}),
      },
    };
  }

  /** Synchronous read — no await needed after init() */
  get config() {
    return this.#config;
  }

  /**
   * Re-read from storage. Use after external changes.
   */
  async refresh() {
    await this.init();
    this.#listeners.forEach((fn) => fn(this.#config));
  }

  /**
   * Update config (partial merge) and persist.
   * @param {object} partial
   */
  async update(partial) {
    this.#config = { ...this.#config, ...partial };
    await storageSet(this.#config);
    this.#listeners.forEach((fn) => fn(this.#config));
  }

  /**
   * Set a single config key and persist.
   * @param {string} key
   * @param {any} value
   */
  async setKey(key, value) {
    this.#config = { ...this.#config, [key]: value };
    await storageSetKey(key, value);
    this.#listeners.forEach((fn) => fn(this.#config));
  }

  /**
   * Reset to defaults and persist.
   */
  async reset() {
    await storageSet(DEFAULT_CONFIG);
    this.#config = { ...DEFAULT_CONFIG };
    this.#listeners.forEach((fn) => fn(this.#config));
  }

  /**
   * Subscribe to config changes.
   * @param {function} fn - callback(config)
   * @returns {function} unsubscribe
   */
  onChange(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }
}

export const store = new ConfigStore();
