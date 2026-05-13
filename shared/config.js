export const DEFAULT_CONFIG = {
  enableAutoGroup: true,
  groupTabNum: 1,
  autoUngroup: false,
  groupStrategy: [1, 2, 3],
  inheritParentGroup: true,
  configuration: {
    fallback: "none",
    rules: [],
    secDomainIgnoreTld: false,
  },
};

const VALID_COLORS = [
  "grey",
  "blue",
  "red",
  "yellow",
  "green",
  "pink",
  "purple",
  "cyan",
  "orange",
];
const VALID_FALLBACKS = ["none", "domain", "secDomain"];
const VALID_MATCH_TYPES = ["domain", "url"];

export function getDefaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

export function validateConfig(config) {
  const errors = [];

  if (config === null || typeof config !== "object" || Array.isArray(config)) {
    return { valid: false, errors: ["Config must be a plain object"] };
  }

  if (typeof config.enableAutoGroup !== "boolean") {
    errors.push("enableAutoGroup must be a boolean");
  }

  if (typeof config.groupTabNum !== "number" || config.groupTabNum < 1) {
    errors.push("groupTabNum must be a number >= 1");
  }

  if (typeof config.autoUngroup !== "boolean") {
    errors.push("autoUngroup must be a boolean");
  }

  if (!Array.isArray(config.groupStrategy)) {
    errors.push("groupStrategy must be an array");
  } else if (config.groupStrategy.length === 0) {
    errors.push("groupStrategy must not be empty");
  } else {
    const validStrategies = [1, 2, 3];
    config.groupStrategy.forEach((strategy, index) => {
      if (!validStrategies.includes(strategy)) {
        errors.push(`groupStrategy[${index}] must be 1, 2, or 3`);
      }
    });
  }

  if (typeof config.inheritParentGroup !== "boolean") {
    errors.push("inheritParentGroup must be a boolean");
  }

  if (!config.configuration || typeof config.configuration !== "object") {
    errors.push("configuration must be an object");
  } else {
    if (!VALID_FALLBACKS.includes(config.configuration.fallback)) {
      errors.push(
        `configuration.fallback must be one of: ${VALID_FALLBACKS.join(", ")}`,
      );
    }

    if (typeof config.configuration.secDomainIgnoreTld !== "boolean") {
      errors.push("configuration.secDomainIgnoreTld must be a boolean");
    }

    if (!Array.isArray(config.configuration.rules)) {
      errors.push("configuration.rules must be an array");
    } else {
      config.configuration.rules.forEach((rule, index) => {
        if (!rule || typeof rule !== "object") {
          errors.push(`configuration.rules[${index}] must be an object`);
          return;
        }

        if (typeof rule.name !== "string" || rule.name.trim() === "") {
          errors.push(
            `configuration.rules[${index}].name must be a non-empty string`,
          );
        }

        if (!VALID_COLORS.includes(rule.color)) {
          errors.push(
            `configuration.rules[${index}].color must be one of: ${VALID_COLORS.join(", ")}`,
          );
        }

        if (!Array.isArray(rule.patterns)) {
          errors.push(
            `configuration.rules[${index}].patterns must be an array`,
          );
        } else if (rule.patterns.length === 0) {
          errors.push(
            `configuration.rules[${index}].patterns must not be empty`,
          );
        } else {
          rule.patterns.forEach((pattern, pIndex) => {
            if (!pattern || typeof pattern !== "object") {
              errors.push(
                `configuration.rules[${index}].patterns[${pIndex}] must be an object`,
              );
              return;
            }

            if (
              typeof pattern.pattern !== "string" ||
              pattern.pattern.trim() === ""
            ) {
              errors.push(
                `configuration.rules[${index}].patterns[${pIndex}].pattern must be a non-empty string`,
              );
            }

            if (!VALID_MATCH_TYPES.includes(pattern.matchType)) {
              errors.push(
                `configuration.rules[${index}].patterns[${pIndex}].matchType must be one of: ${VALID_MATCH_TYPES.join(", ")}`,
              );
            }
          });
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function mergeConfig(saved, defaults) {
  if (saved === null || typeof saved !== "object" || Array.isArray(saved)) {
    return JSON.parse(JSON.stringify(defaults));
  }

  const merged = JSON.parse(JSON.stringify(saved));

  for (const key in defaults) {
    if (Object.prototype.hasOwnProperty.call(defaults, key)) {
      if (merged[key] === undefined) {
        merged[key] = JSON.parse(JSON.stringify(defaults[key]));
      } else if (
        typeof defaults[key] === "object" &&
        defaults[key] !== null &&
        !Array.isArray(defaults[key])
      ) {
        merged[key] = mergeConfig(merged[key], defaults[key]);
      }
    }
  }

  return merged;
}
