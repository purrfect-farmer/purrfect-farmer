import { isElementVisible } from "./lib/utils";

/** Web Version */
const webVersion = location.pathname.startsWith("/k/") ? "k" : "a";

/** Bot URL */
const botURL = import.meta.env.VITE_APP_BOT_URL;

/** Button Text */
const joinButtonTextContent =
  webVersion === "k" ? ["SUBSCRIBE", "JOIN"] : ["JOIN CHANNEL", "JOIN GROUP"];
const confirmButtonTextContent = webVersion === "k" ? "LAUNCH" : "CONFIRM";
const closeButtonTextContent = "CLOSE ANYWAY";

/** Button Selectors */
const buttonSelectors =
  webVersion === "k"
    ? {
        launchButton: ".new-message-bot-commands",
        confirmButton: ".popup-button",
        startButton: ".chat-input-control-button",
        joinButton: ".chat-join, .chat-input-control-button",
      }
    : {
        launchButton: ".bot-menu.open",
        confirmButton: ".confirm-dialog-button",
        startButton: ".join-subscribe-button",
        joinButton: ".join-subscribe-button",
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
  for (const element of document.querySelectorAll(
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
    if (
      element.textContent.trim().toUpperCase() === "START" &&
      isElementVisible(element)
    ) {
      return element;
    }
  }
};

/** Is it a join Button */
const isJoinButton = (element) =>
  joinButtonTextContent.includes(element.textContent.trim().toUpperCase()) &&
  isElementVisible(element);

/** Get Join Button */
const getJoinButton = () => {
  for (const element of document.querySelectorAll(buttonSelectors.joinButton)) {
    if (isJoinButton(element)) {
      return element;
    }
  }
};

/** Click Telegram Web Button */
const clickTelegramWebButton = (button, skip = false) => {
  if (skip && !button) {
    return true;
  } else if (isElementVisible(button)) {
    dispatchClickEventOnElement(button);
    return true;
  } else {
    return false;
  }
};

/** Click Join Button */
const clickJoinButton = () => {
  return clickTelegramWebButton(getJoinButton());
};

/** Click Bot Launch Button */
const clickBotLaunchButton = () => {
  return clickTelegramWebButton(
    document.querySelector(buttonSelectors.launchButton)
  );
};

/** Click Bot Start Button */
const clickBotStartButton = () => {
  return clickTelegramWebButton(getStartButton(), true);
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

/** Join Interval */
let joinObserver;

/** Join Conversation */
const joinConversation = () => {
  /** Clear Previous Observer */
  joinObserver?.disconnect();

  /** Click Join Button */
  let hasClickedJoinButton = clickJoinButton();

  /** Don't click again */
  if (hasClickedJoinButton) return;

  /** Create Observer */
  joinObserver = new MutationObserver(function () {
    if (!hasClickedJoinButton) {
      hasClickedJoinButton = clickJoinButton();
    } else {
      joinObserver.disconnect();
    }
  });

  /** Observe */
  joinObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

/** Farmer Bot Observer */
let farmerBotObserver;

/** Open Farmer Bot */
const openFarmerBot = () => {
  /** Clear Previous Observer */
  farmerBotObserver?.disconnect();

  /** Start Button */
  let hasClickedStartButton = clickBotStartButton();

  /** Click Launch Button */
  let hasClickedLaunchButton = clickBotLaunchButton();

  /** Create Observer */
  farmerBotObserver = new MutationObserver(function () {
    /** Bot is Running */
    if (botIsRunning()) {
      /** Disconnect Observer */
      farmerBotObserver.disconnect();
    } else {
      /** Click the Start Button */
      if (!hasClickedStartButton) {
        hasClickedStartButton = clickBotStartButton();
      }

      if (!hasClickedLaunchButton) {
        /** Click Launch Button */
        hasClickedLaunchButton = clickBotLaunchButton();
      }
    }
  });

  /** Observe */
  farmerBotObserver.observe(document.documentElement, {
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
  name: `telegram-web-${webVersion}`,
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

    case "join-conversation":
      await joinConversation();
      port.postMessage({
        id,
        data: true,
      });
      break;
  }
});

/** Enable auto confirm */
autoConfirm();
