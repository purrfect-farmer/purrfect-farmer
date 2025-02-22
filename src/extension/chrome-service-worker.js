import { createMutexFunction, getSettings, getUserAgent } from "@/lib/utils";

/** Remove Action Popup */
const removeActionPopup = async () => {
  const platform = await chrome.runtime.getPlatformInfo();
  if (platform.os !== "android") {
    await chrome.action.setPopup({ popup: "" }).catch(() => {});
  }
};

/** Close Previous Popups */
const closePreviousPopups = createMutexFunction(async () => {
  const urls = ["chrome://newtab/", chrome.runtime.getURL("index.html")];

  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["popup"],
  });

  for (const window of windows) {
    if (window.tabs.some((tab) => urls.includes(tab.url))) {
      await chrome.windows.remove(window.id);
    }
  }
});

/** Open Farmer */
const openFarmerWindow = createMutexFunction(async () => {
  /** Close Previous Popups */
  await closePreviousPopups();

  /** Create a new window */
  await chrome.windows.create({
    url: chrome.runtime.getURL("index.html"),
    type: "popup",
    state: "maximized",
    focused: true,
  });
});

/** Handle Action Clicked */
const handleActionClicked = () => openFarmerWindow();

/** Configure Extension */
const configureExtension = createMutexFunction(
  async ({ openFarmerInNewWindow }) => {
    const platform = await chrome.runtime.getPlatformInfo();

    if (platform.os !== "android") {
      /** Remove Previous Listener */
      chrome.action.onClicked.removeListener(handleActionClicked);

      /** Configure Action */
      if (openFarmerInNewWindow) {
        chrome.action.onClicked.addListener(handleActionClicked);
      }

      try {
        /** Configure Side Panel */
        await chrome.sidePanel
          .setPanelBehavior({
            openPanelOnActionClick: openFarmerInNewWindow === false,
          })
          .catch(() => {});
      } catch {}
    }
  }
);

/** Update User-Agent */
const updateUserAgent = createMutexFunction(async () => {
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
});

/** Setup Extension */
const setupExtension = createMutexFunction(async () => {
  /** Remove Action Popup */
  await removeActionPopup();

  /** Configure Settings */
  await configureExtension(await getSettings());
});

/** Open Farmer on Startup */
chrome.runtime.onStartup.addListener(async () => {
  /** Get Settings */
  const settings = await getSettings();

  /** Get Platform */
  const platform = await chrome.runtime.getPlatformInfo();

  if (
    platform.os !== "android" &&
    settings.openFarmerOnStartup &&
    settings.openFarmerInNewWindow
  ) {
    /** Main Window */
    let mainWindow;

    try {
      /** Get Main Window */
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
        const tabs = await chrome.tabs.query({
          windowType: "normal",
        });

        if (tabs[0]) {
          await chrome.tabs.update(tabs[0].id, {
            url: "chrome://extensions",
          });
        }
      }
    } catch {}
  }
});

/** Open Farmer on Install */
chrome.runtime.onInstalled.addListener(async (ev) => {
  /** Update User-Agent */
  await updateUserAgent();

  /** Open Farmer Window */
  const settings = await getSettings();

  /** Open Farmer Window */
  if (settings.openFarmerInNewWindow) {
    await openFarmerWindow(true);
  }
});

/** Watch Storage for Settings Change */
chrome.storage.local.onChanged.addListener(({ settings }) => {
  if (settings?.newValue) {
    configureExtension(settings.newValue);
  }
});

/** Setup Extension */
setupExtension();
