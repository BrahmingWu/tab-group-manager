import { STRATEGY_LABELS } from "../core/constants.js";
import { Msg, sendMessage } from "../core/messaging.js";

let currentConfig = null;
let rules = [];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupEventListeners();
  await loadConfig();
}

function setupEventListeners() {
  document
    .getElementById("enable-auto-group")
    .addEventListener("change", (e) => {
      const groupTabNumInput = document.getElementById("group-tab-num");
      groupTabNumInput.disabled = !e.target.checked;
      const autoUngroupInput = document.getElementById("auto-ungroup");
      autoUngroupInput.disabled = !e.target.checked;
    });

  const strategyList = document.getElementById("strategy-list");
  const strategyItems = strategyList.querySelectorAll(".strategy-item");

  strategyItems.forEach((item) => {
    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragend", handleDragEnd);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragleave", handleDragLeave);
  });

  document.querySelectorAll(".strategy-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", (e) => {
      const customSection = document.getElementById("custom-rules-section");
      const customCheckbox = document.getElementById("strategy-3");
      customSection.style.display = customCheckbox.checked ? "block" : "none";

      const secDomainOptions = document.getElementById("sec-domain-options");
      const secDomainCheckbox = document.getElementById("strategy-2");
      secDomainOptions.style.display = secDomainCheckbox.checked
        ? "block"
        : "none";
    });
  });

  document.getElementById("add-rule-btn").addEventListener("click", addRule);
  document.getElementById("import-rules-btn").addEventListener("click", () => {
    document.getElementById("import-file-input").click();
  });
  document
    .getElementById("import-file-input")
    .addEventListener("change", importRules);
  document
    .getElementById("export-rules-btn")
    .addEventListener("click", exportRules);
  document.getElementById("save-btn").addEventListener("click", saveConfig);
  document.getElementById("reset-btn").addEventListener("click", resetConfig);
}

async function loadConfig() {
  try {
    const response = await sendMessage({ type: Msg.GET_CONFIG });
    currentConfig = response.config;
    updateUI(currentConfig);
  } catch (error) {
    showStatus("Failed to load config: " + error.message, "error");
  }
}

function updateUI(config) {
  document.getElementById("enable-auto-group").checked = config.enableAutoGroup;
  document.getElementById("group-tab-num").value = config.groupTabNum;
  document.getElementById("group-tab-num").disabled = !config.enableAutoGroup;
  document.getElementById("auto-ungroup").checked = config.autoUngroup || false;
  document.getElementById("auto-ungroup").disabled = !config.enableAutoGroup;
  document.getElementById("inherit-parent-group").checked =
    config.inheritParentGroup;

  const strategyCheckboxes = document.querySelectorAll(".strategy-checkbox");
  strategyCheckboxes.forEach((checkbox) => {
    checkbox.checked = config.groupStrategy.includes(parseInt(checkbox.value));
  });

  const customSection = document.getElementById("custom-rules-section");
  const customCheckbox = document.getElementById("strategy-3");
  customSection.style.display = customCheckbox.checked ? "block" : "none";

  if (config.configuration) {
    document.getElementById("fallback-strategy").value =
      config.configuration.fallback || "none";
    rules = config.configuration.rules || [];
    document.getElementById("sec-domain-ignore-tld").checked =
      config.configuration.secDomainIgnoreTld || false;
  } else {
    rules = [];
    document.getElementById("sec-domain-ignore-tld").checked = false;
  }
  // Secondary domain options visibility (depends on strategy 2 being enabled)
  const secDomainOptions = document.getElementById("sec-domain-options");
  secDomainOptions.style.display = config.groupStrategy.includes(2)
    ? "block"
    : "none";

  renderRules();
}

function renderRules() {
  const container = document.getElementById("rules-container");
  container.innerHTML = "";

  rules.forEach((rule, index) => {
    const card = createRuleCard(rule, index);
    container.appendChild(card);
  });
}

function createRuleCard(rule, index) {
  const card = document.createElement("div");
  card.className = "rule-card";
  card.dataset.index = index;

  card.innerHTML = `
    <div class="rule-card-header">
      <input type="text" class="rule-name" placeholder="Group name" value="${escapeHtml(rule.name || "")}">
      <select class="rule-color">
        ${[
          "grey",
          "blue",
          "red",
          "yellow",
          "green",
          "pink",
          "purple",
          "cyan",
          "orange",
        ]
          .map(
            (c) =>
              `<option value="${c}" ${rule.color === c ? "selected" : ""}>${c}</option>`,
          )
          .join("")}
      </select>
      <button type="button" class="remove-rule-btn">Remove</button>
    </div>
    <div class="patterns-list">
      ${(rule.patterns || [])
        .map(
          (p, pIndex) => `
        <div class="pattern-row" data-pattern-index="${pIndex}">
          <input type="text" class="pattern-input" placeholder="*.example.com" value="${escapeHtml(p.pattern || "")}">
          <select class="pattern-match-type">
            <option value="domain" ${p.matchType !== "url" ? "selected" : ""}>Domain</option>
            <option value="url" ${p.matchType === "url" ? "selected" : ""}>URL</option>
          </select>
          <button type="button" class="remove-pattern-btn">X</button>
        </div>
      `,
        )
        .join("")}
    </div>
    <button type="button" class="add-pattern-btn">Add Pattern</button>
  `;

  card.querySelector(".remove-rule-btn").addEventListener("click", () => {
    rules.splice(index, 1);
    renderRules();
  });

  card.querySelectorAll(".remove-pattern-btn").forEach((btn, pIndex) => {
    btn.addEventListener("click", () => {
      rule.patterns.splice(pIndex, 1);
      renderRules();
    });
  });

  card.querySelector(".add-pattern-btn").addEventListener("click", () => {
    if (!rule.patterns) rule.patterns = [];
    rule.patterns.push({ pattern: "", matchType: "domain" });
    renderRules();
  });

  card.querySelector(".rule-name").addEventListener("input", (e) => {
    rules[index].name = e.target.value;
  });

  card.querySelector(".rule-color").addEventListener("change", (e) => {
    rules[index].color = e.target.value;
  });

  card.querySelectorAll(".pattern-input").forEach((input, pIndex) => {
    input.addEventListener("input", (e) => {
      rules[index].patterns[pIndex].pattern = e.target.value;
    });
  });

  card.querySelectorAll(".pattern-match-type").forEach((select, pIndex) => {
    select.addEventListener("change", (e) => {
      rules[index].patterns[pIndex].matchType = e.target.value;
    });
  });

  return card;
}

function addRule() {
  rules.push({
    name: "",
    color: "grey",
    patterns: [{ pattern: "", matchType: "domain" }],
  });
  renderRules();
}

async function importRules(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const importedRules = JSON.parse(text);

    if (!Array.isArray(importedRules)) {
      throw new Error("Invalid rules format");
    }

    rules = importedRules;
    renderRules();
    showStatus("Rules imported successfully", "success");
  } catch (error) {
    showStatus("Failed to import rules: " + error.message, "error");
  }

  event.target.value = "";
}

function exportRules() {
  const dataStr = JSON.stringify(rules, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "tab-group-rules.json";
  a.click();

  URL.revokeObjectURL(url);
}

async function saveConfig() {
  const strategyItems = document.querySelectorAll(".strategy-item");
  const selectedStrategies = [];

  strategyItems.forEach((item) => {
    const checkbox = item.querySelector(".strategy-checkbox");
    if (checkbox.checked) {
      selectedStrategies.push(parseInt(checkbox.value));
    }
  });

  if (selectedStrategies.length === 0) {
    showStatus("Please select at least one grouping strategy", "error");
    return;
  }

  const config = {
    enableAutoGroup: document.getElementById("enable-auto-group").checked,
    groupTabNum: parseInt(document.getElementById("group-tab-num").value) || 1,
    autoUngroup: document.getElementById("auto-ungroup").checked,
    inheritParentGroup: document.getElementById("inherit-parent-group").checked,
    groupStrategy: selectedStrategies,
    configuration: {
      fallback: document.getElementById("fallback-strategy").value,
      rules: rules,
      secDomainIgnoreTld: document.getElementById("sec-domain-ignore-tld")
        .checked,
    },
  };

  if (selectedStrategies.includes(3)) {
    for (let i = 0; i < rules.length; i++) {
      if (!rules[i].name || rules[i].name.trim() === "") {
        showStatus(`Rule ${i + 1} is missing a name`, "error");
        return;
      }
      if (!rules[i].patterns || rules[i].patterns.length === 0) {
        showStatus(`Rule "${rules[i].name}" has no patterns`, "error");
        return;
      }
    }
  }

  try {
    await sendMessage({ type: Msg.SET_CONFIG, config });
    currentConfig = config;
    showStatus("Settings saved successfully", "success");
  } catch (error) {
    showStatus("Failed to save settings: " + error.message, "error");
  }
}

async function resetConfig() {
  if (!confirm("Reset all settings to defaults?")) return;

  const defaultConfig = {
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

  try {
    await sendMessage({ type: Msg.SET_CONFIG, config: defaultConfig });
    currentConfig = defaultConfig;
    updateUI(currentConfig);
    showStatus("Settings reset to defaults", "success");
  } catch (error) {
    showStatus("Failed to reset settings: " + error.message, "error");
  }
}

function showStatus(message, type) {
  const statusEl = document.getElementById("status-message");
  statusEl.textContent = message;
  statusEl.className = "status-message " + type;

  setTimeout(() => {
    statusEl.className = "status-message";
  }, 3000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

let draggedItem = null;

function handleDragStart(e) {
  draggedItem = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", this.dataset.strategy);
}

function handleDragEnd(e) {
  this.classList.remove("dragging");
  draggedItem = null;

  document.querySelectorAll(".strategy-item").forEach((item) => {
    item.classList.remove("drag-over");
  });
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  if (this !== draggedItem) {
    this.classList.add("drag-over");
  }
}

function handleDragLeave(e) {
  this.classList.remove("drag-over");
}

function handleDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  if (draggedItem !== this) {
    const strategyList = document.getElementById("strategy-list");
    const allItems = [...strategyList.querySelectorAll(".strategy-item")];
    const draggedIndex = allItems.indexOf(draggedItem);
    const droppedIndex = allItems.indexOf(this);

    if (draggedIndex < droppedIndex) {
      this.parentNode.insertBefore(draggedItem, this.nextSibling);
    } else {
      this.parentNode.insertBefore(draggedItem, this);
    }
  }

  this.classList.remove("drag-over");
}
