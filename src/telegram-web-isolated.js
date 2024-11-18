import { dispatchClickEventOnElement, isElementVisible } from "./lib/utils";

/** Web Version */
const webVersion = location.pathname.startsWith("/k/") ? "k" : "a";

/** Farmer Bot URL */
const farmerBotUrl = import.meta.env.VITE_APP_BOT_URL;

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
        webViewButton: ".is-web-view",
      }
    : {
        launchButton: ".bot-menu.open",
        confirmButton: ".confirm-dialog-button",
        startButton: ".join-subscribe-button",
        joinButton: ".join-subscribe-button",
        webViewButton: "button:has(.icon.icon-webapp)",
      };

/** Join Observer */
let joinObserver;

/** Join Observer Timeout */
let joinObserverTimeout;

/** Bot Observer */
let botObserver;

/** Bot Observer Timeout */
let botObserverTimeout;

/** Click Telegram Web Button */
const clickTelegramWebButton = (button) => {
  if (isElementVisible(button)) {
    /** Dispatch the Click Event */
    dispatchClickEventOnElement(button);
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

/** Is the Bot running */
const botIsRunning = (url, node) => {
  /** An Iframe */
  if (node.tagName === "IFRAME" && node.src.startsWith(url)) {
    return true;
  }

  /** Check Descendant Iframe */
  for (const iframe of node.querySelectorAll("iframe")) {
    if (iframe.src.startsWith(url)) {
      return true;
    }
  }
};

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
    return clickTelegramWebButton(node);
  }

  /** Click Status */
  let status = false;

  /** Descendant Join Button */
  for (const element of node.querySelectorAll(buttonSelectors.joinButton)) {
    if (isJoinButton(element)) {
      status = clickTelegramWebButton(element);

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
    return clickTelegramWebButton(node);
  }

  /** Click Status */
  let status = false;

  /** Descendant Start Button */
  for (const element of node.querySelectorAll(buttonSelectors.startButton)) {
    if (isStartButton(element)) {
      status = clickTelegramWebButton(element);

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
    return clickTelegramWebButton(node);
  }

  /** Click Status */
  let status = false;

  /** Descendant Launch Button */
  for (const element of node.querySelectorAll(
    isWebView ? buttonSelectors.webViewButton : buttonSelectors.launchButton
  )) {
    status = clickTelegramWebButton(element);

    if (status) {
      return status;
    }
  }
};

/** Join Conversation */
const joinConversation = () => {
  /** Clear Previous Timeout */
  clearTimeout(joinObserverTimeout);

  /** Clear Previous Observer */
  joinObserver?.disconnect();

  /** Click Join Button */
  let hasClickedJoinButton = false;

  /** Create Observer */
  joinObserver =
    joinObserver ||
    new MutationObserver(function (mutationList) {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (!hasClickedJoinButton) {
                hasClickedJoinButton = findAndClickJoinButton(node);
              } else {
                /** Clear Timeout */
                clearTimeout(joinObserverTimeout);

                /** Disconnect */
                joinObserver.disconnect();
              }
            }
          });
        } else if (mutation.type == "attributes") {
          if (!hasClickedJoinButton) {
            hasClickedJoinButton = findAndClickJoinButton(mutation.target);
          } else {
            /** Clear Timeout */
            clearTimeout(joinObserverTimeout);

            /** Disconnect */
            joinObserver.disconnect();
          }
        }
      }
    });

  /** Observe */
  joinObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  /** Set Timeout to Stop Observing */
  joinObserverTimeout = setTimeout(() => {
    joinObserver.disconnect();
  }, 30_000);
};

/** Open Bot */
const openBot = (url, isWebView) => {
  /** Clear Previous Timeout */
  clearTimeout(botObserverTimeout);

  /** Clear Previous Observer */
  botObserver?.disconnect();

  /** Has clicked Start Button? */
  let hasClickedStartButton = false;

  /** Has clicked Launch Button? */
  let hasClickedLaunchButton = false;

  /** Create Observer */
  botObserver =
    botObserver ||
    new MutationObserver(function (mutationList) {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              /** Bot Is Running */
              if (botIsRunning(url, node)) {
                /** Clear Timeout */
                clearTimeout(botObserverTimeout);

                /** Disconnect */
                botObserver.disconnect();
                return;
              }

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
          }
        }
      }
    });

  /** Observe */
  botObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  /** Set Timeout to Stop Observing */
  botObserverTimeout = setTimeout(() => {
    botObserver.disconnect();
  }, 30_000);
};

/** Open Farmer Bot */
const openFarmerBot = () => {
  return openBot(farmerBotUrl);
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

/** Connect to Messaging */
const port = chrome.runtime.connect(chrome.runtime.id, {
  name: `telegram-web-${webVersion}`,
});

/** Listen for Port Message */
port.onMessage.addListener(async (message) => {
  const { id, action, data } = message;
  switch (action) {
    case "open-bot":
      await openBot(data.url, true);
      port.postMessage({
        id,
        data: true,
      });
      break;

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
