import { getSettings, getUserAgent } from "./lib/utils";

const removeActionPopup = async () => {
  const platform = await chrome.runtime.getPlatformInfo();
  if (platform.os !== "android") {
    await chrome.action.setPopup({ popup: "" }).catch(() => {});
  }
};

const closePreviousPopups = async () => {
  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["popup"],
  });

  for (const window of windows) {
    if (window.tabs.some((tab) => tab.url === "chrome://newtab/")) {
      await chrome.windows.remove(window.id);
    }
  }
};

/** Open Farmer */
const openFarmerWindow = async () => {
  chrome.windows.create({
    url: "index.html",
    type: "popup",
    state: "maximized",
    focused: true,
  });
};

const configureExtension = async (settings) => {
  /** Configure Action */
  if (settings.openFarmerInNewWindow) {
    chrome.action.onClicked.addListener(openFarmerWindow);
  } else {
    chrome.action.onClicked.removeListener(openFarmerWindow);
  }

  try {
    /** Configure Side Panel */
    await chrome.sidePanel
      .setPanelBehavior({
        openPanelOnActionClick: !settings.openFarmerInNewWindow,
      })
      .catch(() => {});
  } catch {}
};

/** Update User-Agent */
const updateUserAgent = async () => {
  const userAgent = await getUserAgent();

  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map((rule) => rule.id);

  /** Update Rules */
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: [
      {
        id: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [
            {
              header: "user-agent",
              operation: "set",
              value: userAgent,
            },
          ],
        },
        condition: {
          urlFilter: "*",
        },
      },
    ],
  });

  /** Store User-Agent */
  await chrome.storage.local.set({
    userAgent,
  });
};

/** Setup Extension */
const setupExtension = async () => {
  /** Configure Settings */
  await configureExtension(await getSettings());

  /** Update User-Agent */
  await updateUserAgent();

  /** Remove Action Popup */
  await removeActionPopup();
};

/** Watch Storage for Settings Change */
chrome.storage.local.onChanged.addListener(({ settings }) => {
  if (settings) {
    configureExtension(settings.newValue);
  }
});

/** Open Farmer on Install */
chrome.runtime.onInstalled.addListener(async () => {
  /** Setup Extension */
  await setupExtension();

  /** Open Farmer Window */
  const settings = await getSettings();
  if (settings.openFarmerInNewWindow && settings.openFarmerOnStartup) {
    await closePreviousPopups();
    await openFarmerWindow();
  }
});

/** Open Farmer on Startup */
chrome.runtime.onStartup.addListener(async () => {
  /** Setup Extension */
  await setupExtension();

  /** Get Platform */
  const platform = await chrome.runtime.getPlatformInfo();

  /** Get Settings */
  const settings = await getSettings();

  if (
    platform.os !== "android" &&
    settings.openFarmerOnStartup &&
    settings.openFarmerInNewWindow
  ) {
    /** Main Window */
    let mainWindow;

    try {
      mainWindow = await chrome.windows.getCurrent();
    } catch {}

    /** Open Farmer Window */
    await openFarmerWindow();

    try {
      if (settings.closeMainWindowOnStartup) {
        /** Close Main Window */
        if (mainWindow?.id) {
          await chrome.windows.remove(mainWindow.id);
        }
      } else {
        /** Go to extensions page */
        const tabs = await chrome.tabs.query({});

        if (tabs[0]) {
          await chrome.tabs.update(tabs[0].id, {
            url: "chrome://extensions",
          });
        }
      }
    } catch {}
  }
});

/** Always Setup Extension */
setupExtension();
