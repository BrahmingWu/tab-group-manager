/**
 * Grouping strategy implementations following strategy pattern.
 */

import { getDomain, getSecDomain, matchPattern } from './utils.js';
import { getGroupKeyByConfig, getGroupTitleByConfig, getGroupColorByConfig } from './configuration.js';

const VALID_URL_SCHEMES = ['http:', 'https:'];

/**
 * Checks if a URL has a valid http/https scheme.
 * @param {string} url - The URL to check
 * @returns {boolean}
 */
function isValidUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return VALID_URL_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * domainStrategy - Groups tabs by full domain
 */
export const domainStrategy = {
  shouldGroup(changeInfo, tab) {
    return isValidUrl(tab.url);
  },

  getGroupTitle(tab) {
    return getDomain(tab.url) || '';
  },

  getGroupColor(tab) {
    return null;
  },

  async querySameTabs(tab) {
    const domain = getDomain(tab.url);
    if (!domain) return [];

    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.filter(t => {
      const tDomain = getDomain(t.url);
      return tDomain === domain && t.id !== tab.id;
    });
  },

  getGroupKey(tab) {
    return getDomain(tab.url) || '';
  }
};

/**
 * secDomainStrategy - Groups tabs by second-level domain
 */
export const secDomainStrategy = {
  shouldGroup(changeInfo, tab) {
    return isValidUrl(tab.url);
  },

  getGroupTitle(tab) {
    return getSecDomain(tab.url) || '';
  },

  getGroupColor(tab) {
    return null;
  },

  async querySameTabs(tab) {
    const secDomain = getSecDomain(tab.url);
    if (!secDomain) return [];

    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.filter(t => {
      const tSecDomain = getSecDomain(t.url);
      return tSecDomain === secDomain && t.id !== tab.id;
    });
  },

  getGroupKey(tab) {
    return getSecDomain(tab.url) || '';
  }
};

/**
 * customStrategy - Groups tabs by user-defined rules
 */
export const customStrategy = {
  shouldGroup(changeInfo, tab) {
    return isValidUrl(tab.url);
  },

  getGroupTitle(tab, userConfig) {
    return getGroupTitleByConfig(tab.url, userConfig);
  },

  getGroupColor(tab, userConfig) {
    return getGroupColorByConfig(tab.url, userConfig);
  },

  async querySameTabs(tab, userConfig) {
    const groupTitle = getGroupTitleByConfig(tab.url, userConfig);
    if (!groupTitle) return [];

    const tabs = await chrome.tabs.query({ currentWindow: true });
    return tabs.filter(t => {
      const tGroupTitle = getGroupTitleByConfig(t.url, userConfig);
      return tGroupTitle === groupTitle && t.id !== tab.id;
    });
  },

  getGroupKey(tab, userConfig) {
    return getGroupKeyByConfig(tab.url, userConfig);
  }
};

/**
 * noGroupStrategy - Never groups (for fallback "none")
 */
export const noGroupStrategy = {
  shouldGroup() {
    return false;
  },

  getGroupTitle() {
    return null;
  },

  getGroupColor() {
    return null;
  },

  async querySameTabs() {
    return [];
  },

  getGroupKey() {
    return null;
  }
};

/**
 * Strategy map by group strategy number
 */
export const STRATEGY_MAP = {
  1: domainStrategy,
  2: secDomainStrategy,
  3: customStrategy
};

/**
 * Get fallback strategy based on fallback mode
 * @param {string} fallback - Fallback mode ('none', 'domain', 'secDomain')
 * @returns {object} The fallback strategy
 */
export function getFallbackStrategy(fallback) {
  switch (fallback) {
    case 'domain':
      return domainStrategy;
    case 'secDomain':
      return secDomainStrategy;
    case 'none':
    default:
      return noGroupStrategy;
  }
}
