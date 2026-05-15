import { getDomain } from "./utils.js";

export function getGroupKeyByConfig(url, configuration) {
  const domain = getDomain(url);
  const rules = configuration?.rules || [];
  for (const rule of rules) {
    const patterns = rule?.patterns || [];
    for (const obj of patterns) {
      if (obj?.pattern) {
        const matchType = obj.matchType || "domain";
        const matchTarget = matchType === "url" ? url : domain;

        if (matchTarget && isExpressionMatched(matchTarget, obj.pattern)) {
          return rule.name;
        }
      }
    }
  }
  return null;
}

export function getGroupTitleByConfig(url, configuration) {
  return getGroupKeyByConfig(url, configuration);
}

export function getGroupColorByConfig(url, configuration) {
  const domain = getDomain(url);
  const rules = configuration?.rules || [];
  for (const rule of rules) {
    const patterns = rule?.patterns || [];
    for (const obj of patterns) {
      if (obj?.pattern) {
        const matchType = obj.matchType || "domain";
        const matchTarget = matchType === "url" ? url : domain;

        if (matchTarget && isExpressionMatched(matchTarget, obj.pattern)) {
          return rule.color || "grey";
        }
      }
    }
  }
  return null;
}

function isExpressionMatched(matchTarget, expression) {
  const escaped = expression.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  const regexPattern = escaped.replace(/\*/g, ".*");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(matchTarget);
}
