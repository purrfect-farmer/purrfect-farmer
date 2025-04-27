import "@/lib/bridge-service-worker";

import {
  closeWindow,
  customLogger,
  getSettings,
  getWindowCoords,
} from "@/lib/utils";

const isBridge = typeof import.meta.env.VITE_BRIDGE !== "undefined";

/** Should Open In New Window */
const shouldOpenInNewWindow = async () => {
  /** Get Platform */
  const platform = await chrome.runtime.getPlatformInfo();

  /** Get Settings */
  const { openFarmerInNewWindow } = await getSettings();

  return (
    openFarmerInNewWindow || platform.os === chrome.runtime.PlatformOs.ANDROID
  );
};

/**
 * Close Previous Popups
 * @param {chrome.windows.Window[]} windows
 * @param {chrome.windows.Window} currentWindow
 */
const closePreviousPopups = async (windows, currentWindow) => {
  const windowsToClose = windows.filter(
    (window) =>
      window.id !== currentWindow.id &&
      window.tabs.some((tab) =>
        tab.url.startsWith(
          isBridge ? import.meta.env.VITE_APP_PWA_URL : "chrome://newtab/"
        )
      )
  );

  for (const window of windowsToClose) {
    await closeWindow(window.id);
  }
};

/** Open Farmer */
const openFarmerWindow = async (newWindow = false) => {
  /** Index Page */
  const indexPage = isBridge
    ? import.meta.env.VITE_APP_PWA_URL
    : chrome.runtime.getURL("index.html");

  /** Get All Windows */
  const windows = await chrome.windows.getAll({
    populate: true,
    windowTypes: ["popup"],
  });

  /** Find Previous Window */
  let currentWindow =
    newWindow === false
      ? windows.find((window) =>
          window.tabs.some((tab) => tab.url.startsWith(indexPage))
        )
      : null;

  /** Get Coords */
  const coords = await getWindowCoords();

  if (currentWindow) {
    /** Focus Previous Window */
    await chrome.windows.update(currentWindow.id, {
      ...coords,
      focused: true,
      state: "normal",
    });
  } else {
    /** Create a new window */
    currentWindow = await chrome.windows.create({
      ...coords,
      type: "popup",
      focused: true,
      url: indexPage,
    });
  }

  /** Close Previous Popups */
  await closePreviousPopups(windows, currentWindow);
};

/** Configure Extension */
const configureExtension = async ({ openFarmerInNewWindow }) => {
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

  /** Get Settings */
  const {
    openFarmerOnStartup,
    openFarmerInNewWindow,
    closeMainWindowOnStartup,
  } = await getSettings();

  if (openFarmerOnStartup && openFarmerInNewWindow) {
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

  /** Should Open In new Window */
  if (await shouldOpenInNewWindow()) {
    /** Open Farmer Window */
    await openFarmerWindow(true);
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
