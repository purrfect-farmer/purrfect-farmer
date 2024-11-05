import { isElementVisible } from "./lib/utils";

/** Web Version */
const webVersion = location.pathname.startsWith("/k/") ? "k" : "a";

/** Bot URL */
const botURL = import.meta.env.VITE_APP_BOT_URL;

/** Button Text */
const confirmButtonTextContent = webVersion === "k" ? "LAUNCH" : "CONFIRM";
const closeButtonTextContent = "CLOSE ANYWAY";

/** Button Selectors */
const buttonSelectors =
  webVersion === "k"
    ? {
        launchButton: ".new-message-bot-commands",
        confirmButton: ".popup-button",
        startButton: ".chat-input-control-button",
      }
    : {
        launchButton: ".bot-menu.open",
        confirmButton: ".confirm-dialog-button",
        startButton: ".join-subscribe-button",
      };

/** Dispatch Click Event on Element */
const dispatchClickEventOnElement = (element) => {
  ["mousedown", "click"].forEach((eventType) => {
    /** Dispatch the event */
    element.dispatchEvent(
      new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
      })
    );
  });
};

/** Confirm Popup */
const confirmPopup = () => {
  for (let element of document.querySelectorAll(
    buttonSelectors.confirmButton
  )) {
    const elementTextContent = element.textContent.trim().toUpperCase();
    if (
      [confirmButtonTextContent, closeButtonTextContent].includes(
        elementTextContent
      )
    ) {
      dispatchClickEventOnElement(element);
    }
  }
};

/** Get Start Button */
const getStartButton = () => {
  for (let element of document.querySelectorAll(buttonSelectors.startButton)) {
    if (element.textContent.trim().toLowerCase() === "start") {
      return element;
    }
  }
};

/** Click Bot Launch Button */
const clickBotLaunchButton = () => {
  const launchButton = document.querySelector(buttonSelectors.launchButton);

  if (launchButton && isElementVisible(launchButton)) {
    dispatchClickEventOnElement(launchButton);
    return true;
  }
};

/** Click Bot Start Button */
const clickBotStartButton = () => {
  const startButton = getStartButton();
  if (startButton && isElementVisible(startButton)) {
    dispatchClickEventOnElement(startButton);
    return true;
  }
};

/** Is the Bot running */
const botIsRunning = () => {
  const iframes = document.querySelectorAll("iframe");

  for (const iframe of iframes) {
    if (iframe.src.startsWith(botURL)) {
      return true;
    }
  }
};

/** Open Farmer Bot */
const openFarmerBot = () => {
  /** Start Button */
  let hasClickedStartButton = clickBotStartButton();

  /** Click Launch Button */
  let hasClickedLaunchButton = clickBotLaunchButton();

  /** Start Observing */
  const observer = new MutationObserver(function () {
    /** Bot is Running */
    if (botIsRunning()) {
      observer.disconnect();
    } else {
      /** Click the Start Button */
      if (!hasClickedStartButton) {
        hasClickedStartButton = clickBotStartButton();
      }

      /** Click Launch Button */
      if (!hasClickedLaunchButton) {
        hasClickedLaunchButton = clickBotLaunchButton();
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

/** Auto Confirm Dialog */
const autoConfirm = () => {
  /** Start Observing */
  const observer = new MutationObserver(function (mutationList, observer) {
    confirmPopup();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

/** Connect to Messaging */
const port = chrome.runtime.connect(chrome.runtime.id, {
  name: `telegram-web:${webVersion}`,
});

/** Listen for Port Message */
port.onMessage.addListener(async (message) => {
  const { id, action, data } = message;
  switch (action) {
    case "open-farmer-bot":
      await openFarmerBot();
      port.postMessage({
        id,
        data: true,
      });
      break;
  }
});

/** Set Port */
port.postMessage({
  action: `set-port:telegram-web-${webVersion}`,
});

/** Enable auto confirm */
autoConfirm();
