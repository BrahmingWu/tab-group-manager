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

    // Migrate old numeric strategy IDs (1,2,3) to new string IDs ("domain","custom")
    if (
      result.groupStrategy &&
      result.groupStrategy.length > 0 &&
      typeof result.groupStrategy[0] === "number"
    ) {
      const oldStrategy = result.groupStrategy;
      const newStrategy = [];
      const hasDomain = oldStrategy.includes(1) || oldStrategy.includes(2);
      const hasCustom = oldStrategy.includes(3);

      if (hasDomain) newStrategy.push("domain");
      if (hasCustom) newStrategy.push("custom");

      // Preserve relative ordering: if custom was before domain in old array, swap
      const domainFirst =
        oldStrategy.indexOf(1) < oldStrategy.indexOf(3) &&
        oldStrategy.indexOf(2) < oldStrategy.indexOf(3);

      result.groupStrategy = domainFirst
        ? newStrategy // already ["domain", "custom"]
        : [...newStrategy].reverse();

      // If only secDomain was enabled (strategy 2) without domain (strategy 1), set domainType to secDomain
      if (oldStrategy.includes(2) && !oldStrategy.includes(1)) {
        if (!result.configuration) result.configuration = {};
        result.configuration.domainType = "secDomain";
      }

      console.log(
        "[TabGroupManager] Migrated groupStrategy from",
        oldStrategy,
        "to",
        result.groupStrategy
      );
    }

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
