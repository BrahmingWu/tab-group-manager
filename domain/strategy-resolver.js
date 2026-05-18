/**
 * Strategy resolution with fallback logic.
 * Extracted from service-worker.js — pure logic, no Chrome API calls.
 */

import { STRATEGY_MAP, getFallbackStrategy } from "./strategies.js";

export function resolveStrategy(config) {
  const strategies = config.groupStrategy || ["domain"];

  if (strategies.length === 1) {
    const strategy = STRATEGY_MAP[strategies[0]] || STRATEGY_MAP["domain"];
    const fallbackStrategy = getFallbackStrategy(
      config.configuration?.fallback || "none",
    );

    if (strategies[0] === "custom") {
      return wrapCustomWithFallback(strategy, fallbackStrategy, config);
    }

    return wrapWithConfig(strategy, config);
  }

  return resolveMultiStrategy(strategies, config);
}

function wrapCustomWithFallback(strategy, fallbackStrategy, config) {
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
}

function wrapWithConfig(strategy, config) {
  return {
    shouldGroup: (changeInfo, tab) => strategy.shouldGroup(changeInfo, tab),
    getGroupTitle: (tab) => strategy.getGroupTitle(tab, config),
    getGroupColor: (tab) => strategy.getGroupColor(tab, config),
    getGroupKey: (tab) => strategy.getGroupKey(tab, config),
    querySameTabs: (tab) => strategy.querySameTabs(tab, config),
  };
}

function resolveMultiStrategy(strategyIds, config) {
  const strategyList = strategyIds
    .map((s) => STRATEGY_MAP[s])
    .filter((s) => s);
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
