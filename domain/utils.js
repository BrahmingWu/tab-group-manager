/**
 * Utility functions for domain extraction and pattern matching.
 */

const COUNTRY_CODE_SECOND_LEVEL_DOMAINS = new Set([
  "co",
  "com",
  "net",
  "org",
  "ac",
  "gv",
  "or",
  "ne",
  "gov",
]);

export function getDomain(url) {
  if (!url || typeof url !== "string") {
    return "";
  }

  try {
    let urlToParse = url;
    if (!url.includes("://")) {
      urlToParse = `https://${url}`;
    }

    const urlObj = new URL(urlToParse);
    return urlObj.hostname;
  } catch {
    const domain = url
      .replace(/^[a-zA-Z]+:\/\//, "")
      .split("/")[0]
      .split(":")[0];
    return domain;
  }
}

export function getSecDomain(url) {
  if (!url || typeof url !== "string") {
    return "";
  }

  const domain = getDomain(url);

  if (!domain) {
    return "";
  }

  if (/^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
    return domain;
  }

  if (!domain.includes(".")) {
    return domain;
  }

  const parts = domain.split(".");

  if (parts.length <= 2) {
    return domain;
  }

  const tld = parts[parts.length - 1];
  const sld = parts[parts.length - 2];

  if (COUNTRY_CODE_SECOND_LEVEL_DOMAINS.has(sld) && parts.length >= 3) {
    return parts.slice(parts.length - 3).join(".");
  }

  return parts.slice(parts.length - 2).join(".");
}

export function getSldOnly(secDomain) {
  const parts = secDomain.split(".");
  return parts[0] || secDomain;
}

export function matchPattern(value, pattern) {
  if (!value || !pattern) return false;
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regexPattern = escaped.replace(/\*/g, ".*");
  const regex = new RegExp(`^${regexPattern}$`, "i");
  return regex.test(value);
}

export function isValidUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}
