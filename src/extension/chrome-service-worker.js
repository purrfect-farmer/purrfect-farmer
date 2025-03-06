import {
  closeWindow,
  customLogger,
  getSettings,
  getUserAgent,
  watchWindowStateUpdate,
} from "@/lib/utils";

/** Close Previous Popups */
const closePreviousPopups = async (windowId) => {
  const indexPage = chrome.runtime.getURL("index.html");
  const tabs = await chrome.tabs.query({
    windowType: "popup",
  });

  for (const tab of tabs) {
    const isEmptyTab = tab.url === "chrome://newtab/";
    const isPreviousWindow = tab.url === indexPage && tab.windowId !== windowId;

    if (isEmptyTab || isPreviousWindow) {
      await closeWindow(tab.windowId);
    }
  }
};

/** Open Farmer */
const openFarmerWindow = async () => {
  /** Create a new window */
  const window = await chrome.windows.create({
    url: chrome.runtime.getURL("index.html"),
    type: "popup",
    state: "maximized",
    focused: true,
  });

  /** Watch Window Resize */
  await watchWindowStateUpdate(window.id, "maximized", "normal");

  /** Close Previous Popups */
  await closePreviousPopups(window.id);
};

/** Configure Extension */
const configureExtension = async ({ openFarmerInNewWindow }) => {
  /** Get Platform */
  const platform = await chrome.runtime.getPlatformInfo();

  if (platform.os !== "android") {
    /** Remove Popup */
    await chrome.action.setPopup({ popup: "" });

    /** Remove Previous Listener */
    chrome.action.onClicked.removeListener(openFarmerWindow);

    /** Configure Action */
    if (openFarmerInNewWindow) {
      chrome.action.onClicked.addListener(openFarmerWindow);
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

/** Open Farmer on Startup */
chrome.runtime.onStartup.addListener(async () => {
  /** Log */
  customLogger("STARTUP INVOKED", Date.now());

  /** Store that startup has been invoked */
  await chrome.storage.session.set({ startupListenerWasInvoked: true });

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
      /** Get Main Window */
      mainWindow = await chrome.windows.getCurrent();
    } catch {}

    /** Open Farmer Window */
    await openFarmerWindow();

    try {
      if (settings.closeMainWindowOnStartup) {
        /** Close Main Window */
        if (mainWindow?.id) {
          await closeWindow(mainWindow?.id);
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
  /** Log */
  customLogger("ONINSTALLED INVOKED", Date.now());

  /** Setup Extension */
  await setupExtension();

  /** Get Settings */
  const { openFarmerInNewWindow } = await getSettings();

  /** Open Farmer Window */
  if (openFarmerInNewWindow) {
    const { startupListenerWasInvoked } = await chrome.storage.session.get(
      "startupListenerWasInvoked"
    );

    if (!startupListenerWasInvoked) {
      await openFarmerWindow(true);
    }
  }
});

/** Watch Storage for Settings Change */
chrome.storage.local.onChanged.addListener(({ settings }) => {
  if (settings?.newValue) {
    configureExtension(settings.newValue);
  }
});
