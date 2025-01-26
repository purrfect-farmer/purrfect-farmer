import {
  delay,
  dispatchClickEventOnElement,
  isElementVisible,
} from "@/lib/utils";

/** Web Version */
const webVersion = location.pathname.startsWith("/k/") ? "k" : "a";

/** Farmer Bot URL */
const FARMER_BOT_URL = import.meta.env.VITE_APP_BOT_URL;

/** Button Text */
const joinButtonTextContent =
  webVersion === "k" ? ["SUBSCRIBE", "JOIN"] : ["JOIN CHANNEL", "JOIN GROUP"];
const confirmButtonTextContent = webVersion === "k" ? "LAUNCH" : "CONFIRM";
const closeButtonTextContent = "CLOSE ANYWAY";

/** Button Selectors */
const buttonSelectors =
  webVersion === "k"
    ? {
        launchButton: ".new-message-bot-commands.is-view",
        confirmButton: ".popup-button",
        startButton: ".chat-input-control-button",
        joinButton: ".chat-join, .chat-input-control-button",
        webViewButton: ".is-web-view, .reply-markup-button.anchor-url.is-link",
      }
    : {
        launchButton: ".bot-menu.open",
        confirmButton: ".confirm-dialog-button",
        startButton: ".join-subscribe-button",
        joinButton: ".join-subscribe-button",
        webViewButton:
          "button:has(.icon.icon-webapp), .Button:has(.inline-button-text)",
      };

/** Join Observer Abort Controller */
let joinObserverController;

/** Bot Observer Abort Controller */
let botObserverController;

/** Click Telegram Web Button */
const clickTelegramWebButton = (button, timeout = 0) => {
  if (isElementVisible(button)) {
    delay(timeout, true).then(() => {
      /** Dispatch the Click Event */
      dispatchClickEventOnElement(button);
    });
    return true;
  } else {
    return false;
  }
};

/** Is Popup Button */
const isPopupButton = (element) =>
  [confirmButtonTextContent, closeButtonTextContent].includes(
    element.textContent.trim().toUpperCase()
  );

/** Is it a Start Button */
const isStartButton = (element) =>
  element.textContent.trim().toUpperCase() === "START";

/** Is it a Join Button */
const isJoinButton = (element) =>
  joinButtonTextContent.includes(element.textContent.trim().toUpperCase());

/** Find And Confirm Popup */
const findAndConfirmPopup = (node) => {
  /** Matches Start Button */
  if (node.matches(buttonSelectors.confirmButton) && isPopupButton(node)) {
    return dispatchClickEventOnElement(node);
  }

  /** Descendant Start Button */
  for (const element of node.querySelectorAll(buttonSelectors.confirmButton)) {
    if (isPopupButton(element)) {
      return dispatchClickEventOnElement(element);
    }
  }
};

/** Find And Click Join Button */
const findAndClickJoinButton = (node) => {
  /** Matches Join Button */
  if (node.matches(buttonSelectors.joinButton) && isJoinButton(node)) {
    return clickTelegramWebButton(node, 3000);
  }

  /** Click Status */
  let status = false;

  /** Descendant Join Button */
  for (const element of node.querySelectorAll(buttonSelectors.joinButton)) {
    if (isJoinButton(element)) {
      status = clickTelegramWebButton(element, 3000);

      if (status) {
        return status;
      }
    }
  }
};

/** Find And Click Start Button */
const findAndClickStartButton = (node) => {
  /** Matches Start Button */
  if (node.matches(buttonSelectors.startButton) && isStartButton(node)) {
    return clickTelegramWebButton(node, 5000);
  }

  /** Click Status */
  let status = false;

  /** Descendant Start Button */
  for (const element of node.querySelectorAll(buttonSelectors.startButton)) {
    if (isStartButton(element)) {
      status = clickTelegramWebButton(element, 5000);

      if (status) {
        return status;
      }
    }
  }
};

/** Find And Click Launch Button */
const findAndClickLaunchButton = (node, isWebView) => {
  /** Matches Launch Button */
  if (
    node.matches(
      isWebView ? buttonSelectors.webViewButton : buttonSelectors.launchButton
    )
  ) {
    return clickTelegramWebButton(node, 1000);
  }

  /** Click Status */
  let status = false;

  /** Descendant Launch Button */
  for (const element of node.querySelectorAll(
    isWebView ? buttonSelectors.webViewButton : buttonSelectors.launchButton
  )) {
    status = clickTelegramWebButton(element, 1000);

    if (status) {
      return status;
    }
  }
};

/** Join Conversation */
const joinConversation = () => {
  /** Abort Previous Controllers */
  abortObservers();

  /** Click Join Button */
  let hasClickedJoinButton = false;

  /** Create Observer */
  const observer = new MutationObserver(function (mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (!hasClickedJoinButton) {
              hasClickedJoinButton = findAndClickJoinButton(node);
            } else {
              /** Disconnect */
              observer.disconnect();
            }
          }
        });
      } else if (mutation.type == "attributes") {
        if (!hasClickedJoinButton) {
          hasClickedJoinButton = findAndClickJoinButton(mutation.target);
        } else {
          /** Disconnect */
          observer.disconnect();
        }
      }
    }
  });

  /** Set Controller */
  joinObserverController = new AbortController();

  /** Add Abort Event */
  joinObserverController.signal.addEventListener("abort", () => {
    observer.disconnect();
  });

  /** Observe */
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  /** Abort after timeout */
  setTimeout(() => joinObserverController.abort(), 10_000);
};

/** Open Bot */
const openBot = (isWebView) => {
  /** Abort Previous Controllers */
  abortObservers();

  /** Has clicked Start Button? */
  let hasClickedStartButton = false;

  /** Has clicked Launch Button? */
  let hasClickedLaunchButton = false;

  /** Create Observer */
  const observer = new MutationObserver(function (mutationList) {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            /** Click Start Button */
            if (!hasClickedStartButton) {
              hasClickedStartButton = findAndClickStartButton(node);
            }

            /** Click Launch Button */
            if (!hasClickedLaunchButton) {
              hasClickedLaunchButton = findAndClickLaunchButton(
                node,
                isWebView
              );
            } else {
              /** Disconnect */
              observer.disconnect();
            }
          }
        });
      } else if (mutation.type == "attributes") {
        /** Click Start Button */
        if (!hasClickedStartButton) {
          hasClickedStartButton = findAndClickStartButton(mutation.target);
        }

        /** Click Launch Button */
        if (!hasClickedLaunchButton) {
          hasClickedLaunchButton = findAndClickLaunchButton(
            mutation.target,
            isWebView
          );
        } else {
          /** Disconnect */
          observer.disconnect();
        }
      }
    }
  });

  /** Set Controller */
  botObserverController = new AbortController();

  /** Add Abort Event */
  botObserverController.signal.addEventListener("abort", () => {
    observer.disconnect();
  });

  /** Observe */
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  /** Abort after timeout */
  setTimeout(() => botObserverController.abort(), 10_000);
};

/** Open Farmer Bot */
const openFarmerBot = () => {
  return openBot();
};

/** Abort Observers */
const abortObservers = () => {
  botObserverController?.abort();
  joinObserverController?.abort();
};

/** Auto Confirm Dialog */
const autoConfirm = () => {
  /** Start Observing */
  const observer = new MutationObserver(function (mutationList, observer) {
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            findAndConfirmPopup(node);
          }
        });
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
};

/** Farmer Bot Is Running */
const farmerBotIsRunning = (iframes) => {
  for (const iframe of iframes) {
    if (iframe.src.startsWith(FARMER_BOT_URL)) {
      return true;
    }
  }
};

/** Close Popup */
const closePopup = (iframe) => {
  dispatchClickEventOnElement(
    iframe.parentElement.previousElementSibling.querySelector(".popup-close")
  );
};

/** Close Other Popups */
const closeOtherPopups = () => {
  const iframes = document.querySelectorAll(".popup-body.web-app-body iframe");
  if (iframes.length <= 1) return;

  if (farmerBotIsRunning(iframes)) {
    Object.values(iframes)
      .filter((iframe) => !iframe.src.startsWith(FARMER_BOT_URL))
      .forEach((iframe) => {
        closePopup(iframe);
      });
  } else {
    Object.values(iframes)
      .slice(1)
      .reverse()
      .forEach((iframe) => {
        closePopup(iframe);
      });
  }
};

/** Connect to Messaging */
const port = chrome.runtime.connect(chrome.runtime.id, {
  name: `telegram-web-${webVersion}`,
});

/** Listen for Port Message */
port.onMessage.addListener(async (message) => {
  const { id, action, data } = message;
  switch (action) {
    case "abort-observers":
      await abortObservers();
      try {
        port.postMessage({
          id,
          data: true,
        });
      } catch {}

    case "close-other-popups":
      await closeOtherPopups();
      try {
        port.postMessage({
          id,
          data: true,
        });
      } catch {}
    case "open-bot":
      await openBot(true);
      try {
        port.postMessage({
          id,
          data: true,
        });
      } catch {}
      break;

    case "open-farmer-bot":
      await openFarmerBot();
      try {
        port.postMessage({
          id,
          data: true,
        });
      } catch {}
      break;

    case "join-conversation":
      await joinConversation();
      try {
        port.postMessage({
          id,
          data: true,
        });
      } catch {}
      break;
  }
});

/** Enable auto confirm */
autoConfirm();
