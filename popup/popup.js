const STRATEGY_LABELS = {
  1: 'Domain',
  2: 'Secondary Domain',
  3: 'Custom Rules'
};

let currentConfig = null;

document.addEventListener('DOMContentLoaded', init);

async function init() {
  const toggleEl = document.getElementById('auto-group-toggle');
  const groupAllBtn = document.getElementById('group-all-btn');
  const strategyDisplay = document.getElementById('strategy-display');

  try {
    const response = await sendMessage({ type: 'GET_CONFIG' });
    currentConfig = response.config;
    updateUI(currentConfig);
  } catch (error) {
    console.error('Failed to load config:', error);
    strategyDisplay.textContent = 'Error';
  }

  toggleEl.addEventListener('change', async (e) => {
    if (currentConfig) {
      currentConfig.enableAutoGroup = e.target.checked;
      try {
        await sendMessage({
          type: 'SET_CONFIG',
          config: currentConfig
        });
      } catch (error) {
        console.error('Failed to save config:', error);
        e.target.checked = !e.target.checked;
        currentConfig.enableAutoGroup = !currentConfig.enableAutoGroup;
      }
    }
  });

  groupAllBtn.addEventListener('click', async () => {
    groupAllBtn.disabled = true;
    groupAllBtn.textContent = 'Grouping...';
    try {
      await sendMessage({ type: 'GROUP_ALL_TABS' });
      groupAllBtn.textContent = 'Done!';
      setTimeout(() => {
        groupAllBtn.textContent = 'Group All Tabs Now';
        groupAllBtn.disabled = false;
      }, 1500);
    } catch (error) {
      console.error('Failed to group all tabs:', error);
      groupAllBtn.textContent = 'Error';
      groupAllBtn.disabled = false;
    }
  });
}

function updateUI(config) {
  if (!config) return;

  const toggleEl = document.getElementById('auto-group-toggle');
  const strategyDisplay = document.getElementById('strategy-display');

  toggleEl.checked = config.enableAutoGroup;
  const strategyNames = config.groupStrategy.map(s => STRATEGY_LABELS[s]).join(', ');
  strategyDisplay.textContent = strategyNames || 'None';
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}