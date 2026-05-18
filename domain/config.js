import { COLORS, VALID_DOMAIN_TYPES, VALID_FALLBACKS, VALID_MATCH_TYPES } from "../core/constants.js";

export const DEFAULT_CONFIG = {
  enableAutoGroup: true,
  groupTabNum: 1,
  autoUngroup: false,
  groupStrategy: ["domain", "custom"],
  inheritParentGroup: true,
  configuration: {
    domainType: "full",
    secDomainIgnoreTld: false,
    fallback: "none",
    rules: [],
  },
};

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
    const validStrategies = ["domain", "custom"];
    config.groupStrategy.forEach((strategy, index) => {
      if (!validStrategies.includes(strategy)) {
        errors.push(`groupStrategy[${index}] must be one of: ${validStrategies.join(", ")}`);
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

    if (typeof config.configuration?.domainType !== "string" || !VALID_DOMAIN_TYPES.includes(config.configuration.domainType)) {
      errors.push(`configuration.domainType must be one of: ${VALID_DOMAIN_TYPES.join(", ")}`);
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

        if (rule.color && !COLORS.includes(rule.color)) {
          errors.push(
            `configuration.rules[${index}].color must be one of: ${COLORS.join(", ")}`,
          );
        }

        if (!Array.isArray(rule.patterns)) {
          errors.push(
            `configuration.rules[${index}].patterns must be an array`,
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

            if (pattern.matchType) {
              if (!VALID_MATCH_TYPES.includes(pattern.matchType)) {
                errors.push(
                  `configuration.rules[${index}].patterns[${pIndex}].matchType must be one of: ${VALID_MATCH_TYPES.join(", ")}`,
                );
              }
            }
          });
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function mergeConfig(base, overrides) {
  return {
    ...base,
    ...overrides,
    configuration: {
      ...base.configuration,
      ...(overrides.configuration || {}),
    },
  };
}
