/**
 * @fileoverview Utility functions for domain extraction and pattern matching.
 * @module shared/utils
 */

/**
 * Country code second-level domain mappings.
 * These are TLDs that have a second-level domain before the actual domain.
 * @type {Set<string>}
 */
const COUNTRY_CODE_SECOND_LEVEL_DOMAINS = new Set([
  'co',      // e.g., co.uk (United Kingdom)
  'com',     // e.g., com.au (Australia)
  'net',     // e.g., net.br (Brazil)
  'org',     // e.g., org.in (India)
  'ac',      // e.g., ac.uk (United Kingdom - academic), ac.cn (China)
  'gv',      // e.g., gv.gr (Greece)
  'or',      // e.g., or.jp (Japan)
  'ne',      // e.g., ne.jp (Japan)
  'gov',     // e.g., gov.cn (China)
]);

/**
 * Extracts the full domain from a URL.
 * Strips protocol, port, and path from the URL.
 *
 * @param {string} url - The URL to extract domain from
 * @returns {string} The domain (e.g., "github.com")
 * @example
 * getDomain("https://github.com/user/repo") // "github.com"
 * getDomain("http://localhost:3000/path")  // "localhost"
 */
export function getDomain(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  try {
    // Add protocol if missing for URL constructor
    let urlToParse = url;
    if (!url.includes('://')) {
      urlToParse = `https://${url}`;
    }

    const urlObj = new URL(urlToParse);
    return urlObj.hostname;
  } catch {
    const domain = url.replace(/^[a-zA-Z]+:\/\//, '').split('/')[0].split(':')[0];
    return domain;
  }
}

/**
 * Extracts the second-level domain from a URL.
 * Handles country code TLDs like co.uk, com.au, etc.
 *
 * @param {string} url - The URL to extract second-level domain from
 * @returns {string} The second-level domain
 * @example
 * getSecDomain("https://user.github.com")       // "github.com"
 * getSecDomain("https://calendar-uk.co.uk")     // "calendar-uk.co.uk"
 * getSecDomain("https://example.com.au")        // "example.com.au"
 * getSecDomain("localhost")                      // "localhost"
 * getSecDomain("192.168.1.1")                   // "192.168.1.1"
 */
export function getSecDomain(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const domain = getDomain(url);

  if (!domain) {
    return '';
  }

  // Handle IP addresses
  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return domain;
  }

  // Handle localhost and other single-word domains
  if (!domain.includes('.')) {
    return domain;
  }

  const parts = domain.split('.');

  // If we have 2 parts, it's already a second-level domain
  if (parts.length === 2) {
    return domain;
  }

  // Check if the first part is a country code second-level domain
  // If so, return the last 3 parts (e.g., calendar-uk.co.uk)
  if (parts.length >= 3 && COUNTRY_CODE_SECOND_LEVEL_DOMAINS.has(parts[parts.length - 2])) {
    return parts.slice(-3).join('.');
  }

  // Otherwise return the last 2 parts (e.g., github.com)
  return parts.slice(-2).join('.');
}

/**
 * Matches a target string against a glob pattern.
 * Supports * wildcard which matches any characters.
 *
 * @param {string} target - The string to match against the pattern
 * @param {string} pattern - The glob pattern with optional * wildcard
 * @returns {boolean} True if the target matches the pattern
 * @example
 * matchPattern("github.com", "*.github.com") // true
 * matchPattern("github.com", "gitlab.com")   // false
 * matchPattern("api.github.com", "*.github.com") // true
 */
export function matchPattern(target, pattern) {
  if (!target || !pattern) {
    return false;
  }

  // Escape special regex characters in the pattern except *
  let regexPattern = '';
  for (let i = 0; i < pattern.length; i++) {
    const char = pattern[i];
    if (char === '*') {
      regexPattern += '.*';
    } else {
      // Escape regex special characters
      if (char === '.' || char === '[' || char === ']' || char === '(' || char === ')' ||
          char === '{' || char === '}' || char === '+' || char === '?' || char === '^' ||
          char === '$' || char === '|' || char === '\\') {
        regexPattern += '\\' + char;
      } else {
        regexPattern += char;
      }
    }
  }

  // Anchor the pattern for exact matching
  regexPattern = '^' + regexPattern + '$';

  try {
    const regex = new RegExp(regexPattern);
    return regex.test(target);
  } catch {
    return false;
  }
}

/**
 * Validates if a string is a valid HTTP/HTTPS URL.
 *
 * @param {string} url - The URL to validate
 * @returns {boolean} True if the URL is valid with http or https protocol
 * @example
 * isValidUrl("https://github.com")     // true
 * isValidUrl("http://localhost:3000")  // true
 * isValidUrl("ftp://example.com")      // false
 * isValidUrl("not-a-url")              // false
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // Add protocol if missing
    let urlToParse = url;
    if (!url.includes('://')) {
      urlToParse = `https://${url}`;
    }

    const urlObj = new URL(urlToParse);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}