import {
  closeWindow,
  customLogger,
  getSettings,
  getUserAgent,
  getWindowCoords,
} from "@/lib/utils";

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

    /** Configure Action */
    if (openFarmerInNewWindow) {
      chrome.action.onClicked.addListener(openFarmerWindow);
    } else {
      /** Remove Previous Listener */
      chrome.action.onClicked.removeListener(openFarmerWindow);
    }

    try {
      /** Configure Side Panel */
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: openFarmerInNewWindow === false,
      });
    } catch {}
  }
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
  /** Update User-Agent */
  await updateUserAgent();

  /** Configure Settings */
  await configureExtension(await getSettings());
};

/** Setup Service Worker */
const setupServiceWorker = async () => {
  /** Log */
  customLogger("SETUP-SERVICE WORKER", Date.now());

  /** Setup Extension */
  await setupExtension();

  /** Get Settings */
  const { openFarmerInNewWindow, openFarmerOnStartup } = await getSettings();

  /** Was Startup Invoked */
  const { onStartupInvoked, onInstalledInvoked } =
    await chrome.storage.session.get({
      onInstalledInvoked: false,
      onStartupInvoked: false,
    });

  /** Log Result */
  customLogger("ON-STARTUP WAS INVOKED", onStartupInvoked);
  customLogger("ON-INSTALLED WAS INVOKED", onInstalledInvoked);

  if (openFarmerInNewWindow) {
    if (onStartupInvoked === false || openFarmerOnStartup) {
      await openFarmerWindow();
    }
  } else {
    if (onStartupInvoked === false && onInstalledInvoked === false) {
      try {
        await chrome.sidePanel.open();
      } catch (e) {
        console.error(e);
      }
    }
  }

  /** Store Setup Completion Time */
  await chrome.storage.session.set({
    serviceWorkerSetup: Date.now(),
  });
};

/** onStartup */
chrome.runtime.onStartup.addListener(async () => {
  /** Store onStartUp Invoked */
  await chrome.storage.session.set({
    onStartupInvoked: true,
  });

  /** Log */
  customLogger("ON-STARTUP INVOKED", Date.now());

  /** Handle Storage Change */
  const handleStorageChange = async (changes) => {
    const { serviceWorkerSetup } = changes;
    if (serviceWorkerSetup) {
      /** Remove Watch */
      chrome.storage.session.onChanged.removeListener(handleStorageChange);

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
    }
  };

  /** Add Listener for Storage Change */
  chrome.storage.session.onChanged.addListener(handleStorageChange);
});

/** onInstalled  */
chrome.runtime.onInstalled.addListener(async () => {
  /** Store onInstalled Invoked */
  await chrome.storage.session.set({
    onInstalledInvoked: true,
  });

  /** Log */
  customLogger("ON-INSTALLED INVOKED", Date.now());
});

/** Watch Storage for Settings Change */
chrome.storage.local.onChanged.addListener(({ settings }) => {
  if (settings?.newValue) {
    configureExtension(settings.newValue);
  }
});

/** Always Setup Service Worker  */
setupServiceWorker();
