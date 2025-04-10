import {
  closeWindow,
  customLogger,
  getSettings,
  getUserAgent,
  getWindowCoords,
} from "@/lib/utils";

import rules from "./rule-resources";

/** Should Open In New Window */
const shouldOpenInNewWindow = async (force = false) => {
  /** Get Platform */
  const platform = await chrome.runtime.getPlatformInfo();

  /** Get Settings */
  const { openFarmerInNewWindow } = await getSettings();

  return (force || platform.os !== "android") && openFarmerInNewWindow;
};

/**
 * Close Previous Popups
 * @param {chrome.windows.Window[]} windows
 */
const closePreviousPopups = async (windows) => {
  const windowsToClose = windows.filter((window) =>
    window.tabs.some((tab) => tab.url === "chrome://newtab/")
  );

  for (const window of windowsToClose) {
    await closeWindow(window.id);
  }
};

/** Open Farmer */
const openFarmerWindow = async () => {
  /** Index Page */
  const indexPage = chrome.runtime.getURL("index.html");

  /** Get All Windows */
  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["popup"],
  });

  /** Find Previous Window */
  const window = windows.find((window) =>
    window.tabs.some((tab) => tab.url === indexPage)
  );

  /** Get Coords */
  const coords = await getWindowCoords();

  if (window) {
    /** Focus Previous Window */
    await chrome.windows.update(window.id, {
      ...coords,
      focused: true,
      state: "normal",
    });
  } else {
    /** Create a new window */
    await chrome.windows.create({
      ...coords,
      type: "popup",
      focused: true,
      url: indexPage,
    });
  }

  /** Close Previous Popups */
  await closePreviousPopups(windows);
};

/** Configure Extension */
const configureExtension = async ({ openFarmerInNewWindow }) => {
  /** Get Platform */
  const platform = await chrome.runtime.getPlatformInfo();

  if (platform.os !== "android") {
    /** Remove Popup */
    await chrome.action.setPopup({ popup: "" });

    try {
      /** Configure Side Panel */
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: openFarmerInNewWindow === false,
      });
    } catch (e) {
      console.error(e);
    }
  }
};

/** Update Dynamic Rules */
const updateDynamicRules = async () => {
  const userAgent = await getUserAgent();

  const oldRules = await chrome.declarativeNetRequest.getDynamicRules();
  const oldRuleIds = oldRules.map((rule) => rule.id);
  const newRules = [
    {
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
    ...rules,
  ].map((item, index) => ({ ...item, id: index + 1 }));

  /** Update Rules */
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
    addRules: newRules,
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
};

/** Action */
chrome.action.onClicked.addListener(async () => {
  /** Log */
  customLogger("ACTION CLICKED", new Date());

  /** Should Open In new Window */
  if (await shouldOpenInNewWindow()) {
    /** Open Farmer Window */
    await openFarmerWindow();
  }
});

/** onStartup */
chrome.runtime.onStartup.addListener(async () => {
  /** Log */
  customLogger("ON-STARTUP INVOKED", new Date());

  /** Get Platform */
  const platform = await chrome.runtime.getPlatformInfo();

  /** Get Settings */
  const {
    openFarmerOnStartup,
    openFarmerInNewWindow,
    closeMainWindowOnStartup,
  } = await getSettings();

  if (
    platform.os !== "android" &&
    openFarmerOnStartup &&
    openFarmerInNewWindow
  ) {
    /** Open Window */
    await openFarmerWindow();

    /** Retrieve Tabs */
    const tabs = await chrome.tabs.query({
      windowType: "normal",
    });

    if (tabs.length === 0) return;

    try {
      if (closeMainWindowOnStartup) {
        /** Close Main Window */
        await closeWindow(tabs[0].windowId);
      } else {
        /** Go to extensions page */
        await chrome.tabs.update(tabs[0].id, {
          url: "chrome://extensions",
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
});

/** onInstalled  */
chrome.runtime.onInstalled.addListener(async (ev) => {
  /** Log */
  customLogger("ON-INSTALLED INVOKED", new Date());

  /** Update Dynamic Rules */
  await updateDynamicRules();

  /** Should Open In new Window */
  if (await shouldOpenInNewWindow(true)) {
    /** Open Farmer Window */
    await openFarmerWindow();
  }
});

/** Watch Storage for Settings Change */
chrome.storage.local.onChanged.addListener(({ settings }) => {
  if (settings?.newValue) {
    configureExtension(settings.newValue);
  }
});

/** Always Setup Extension  */
setupExtension();
