import { isElementVisible } from "./lib/utils";

(function () {
  const webVersion = location.pathname.startsWith("/k/") ? "k" : "a";

  const botChatId = "7592929753";
  const botUsername = "@purrfect_little_bot";
  const botURL = "https://purrfect-farmer.github.io/purrfect-mini-app";
  const botLocationHash = `#${webVersion === "k" ? botUsername : botChatId}`;

  const confirmButtonTextContent = webVersion === "k" ? "LAUNCH" : "CONFIRM";
  const closeButtonTextContent = "CLOSE ANYWAY";

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

  let hasClickedBotStartButton = false;
  let hasClickedBotLaunchButton = false;

  const dispatchClickEventOnElement = (element) => {
    const event =
      webVersion === "k"
        ? new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
          })
        : new MouseEvent("mousedown", {
            bubbles: true,
            cancelable: true,
          });

    /** Dispatch the event */
    element.dispatchEvent(event);
  };

  /** Confirm Popup */
  const confirmPopup = () => {
    for (let element of document.querySelectorAll(
      buttonSelectors.confirmButton
    )) {
      if (
        [confirmButtonTextContent, closeButtonTextContent].includes(
          element.textContent.trim().toUpperCase()
        )
      ) {
        dispatchClickEventOnElement(element);
      }
    }
  };

  /** Get Start Button */
  const getStartButton = () => {
    for (let element of document.querySelectorAll(
      buttonSelectors.startButton
    )) {
      if (element.textContent.trim().toLowerCase() === "start") {
        return element;
      }
    }
  };

  const resetBotButtons = () => {
    hasClickedBotLaunchButton = false;
    hasClickedBotStartButton = false;
  };

  const clickBotLaunchButton = () => {
    const launchButton = document.querySelector(buttonSelectors.launchButton);

    if (launchButton && isElementVisible(launchButton)) {
      if (!hasClickedBotLaunchButton) {
        dispatchClickEventOnElement(launchButton);
      }
      return (hasClickedBotLaunchButton = true);
    }
  };

  const clickBotStartButton = () => {
    const startButton = getStartButton();
    if (startButton && isElementVisible(startButton)) {
      if (!hasClickedBotStartButton) {
        dispatchClickEventOnElement(startButton);
      }
      return (hasClickedBotStartButton = true);
    }
  };

  /** Is the Bot running */
  const botIsRunning = () => {
    const iframes = document.querySelectorAll("iframe");

    for (let iframe of iframes) {
      if (iframe.src.startsWith(botURL)) {
        return true;
      }
    }
  };

  const openFarmerBot = () => {
    /** Change Location Hash */
    location.hash = botLocationHash;

    if (botIsRunning()) {
      return;
    }

    /** Start Button */
    clickBotStartButton();

    /** Click Launch Button */
    clickBotLaunchButton();

    if (hasClickedBotLaunchButton) {
      resetBotButtons();
      return;
    }

    /** Start Observing */
    const observer = new MutationObserver(function (mutationList, observer) {
      if (botIsRunning()) {
        observer.disconnect();
        resetBotButtons();
      } else {
        clickBotStartButton();
        clickBotLaunchButton();
      }
    });

    observer.observe(document, { childList: true, subtree: true });
  };

  /** Auto Confirm Dialog */
  const autoConfirm = () => {
    /** Start Observing */
    const observer = new MutationObserver(function (mutationList, observer) {
      confirmPopup();
    });

    observer.observe(document, { childList: true, subtree: true });
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
})();
