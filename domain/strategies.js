import { getDomain, getSecDomain, matchPattern, getSldOnly, isValidUrl } from "./utils.js";
import {
  getGroupKeyByConfig,
  getGroupTitleByConfig,
  getGroupColorByConfig,
} from "./rule-engine.js";

export const domainStrategy = {
  shouldGroup(_changeInfo, tab) {
    return isValidUrl(tab.url);
  },

  getGroupTitle(tab) {
    return getDomain(tab.url) || "";
  },

  getGroupColor(_tab) {
    return null;
  },

  async querySameTabs(tab) {
    const domain = getDomain(tab.url);
    if (!domain) return [];

    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.filter((t) => {
      const tDomain = getDomain(t.url);
      return tDomain === domain && t.id !== tab.id;
    });
  },

  getGroupKey(tab) {
    return getDomain(tab.url) || "";
  },
};

export const secDomainStrategy = {
  shouldGroup(_changeInfo, tab) {
    return isValidUrl(tab.url);
  },

  getGroupTitle(tab, config) {
    const sec = getSecDomain(tab.url);
    if (!sec) return "";
    return config?.configuration?.secDomainIgnoreTld ? getSldOnly(sec) : sec;
  },

  getGroupColor(_tab) {
    return null;
  },

  async querySameTabs(tab, config) {
    const key = this.getGroupKey(tab, config);
    if (!key) return [];

    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.filter((t) => {
      const tKey = this.getGroupKey(t, config);
      return tKey === key && t.id !== tab.id;
    });
  },

  getGroupKey(tab, config) {
    const sec = getSecDomain(tab.url);
    if (!sec) return "";
    return config?.configuration?.secDomainIgnoreTld ? getSldOnly(sec) : sec;
  },
};

export const customStrategy = {
  shouldGroup(_changeInfo, tab) {
    return isValidUrl(tab.url);
  },

  getGroupTitle(tab, userConfig) {
    return getGroupTitleByConfig(tab.url, userConfig);
  },

  getGroupColor(tab, userConfig) {
    return getGroupColorByConfig(tab.url, userConfig);
  },

  async querySameTabs(tab, userConfig) {
    const key = this.getGroupKey(tab, userConfig);
    if (!key) return [];

    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.filter((t) => {
      const tKey = this.getGroupKey(t, userConfig);
      return tKey === key && t.id !== tab.id;
    });
  },

  getGroupKey(tab, userConfig) {
    return getGroupKeyByConfig(tab.url, userConfig);
  },
};

export const noGroupStrategy = {
  shouldGroup() {
    return false;
  },

  getGroupTitle() {
    return "";
  },

  getGroupColor() {
    return null;
  },

  async querySameTabs() {
    return [];
  },

  getGroupKey() {
    return "";
  },
};

export const STRATEGY_MAP = {
  1: domainStrategy,
  2: secDomainStrategy,
  3: customStrategy,
};

export function getFallbackStrategy(fallback) {
  switch (fallback) {
    case "domain":
      return domainStrategy;
    case "secDomain":
      return secDomainStrategy;
    default:
      return noGroupStrategy;
  }
}
