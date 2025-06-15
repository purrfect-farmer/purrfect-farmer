import { clickElementCenter, isElementVisible } from "@/lib/utils";

if (location.host === "web.telegram.org") {
  /** Web Version */
  const WEB_VERSION = location.pathname.startsWith("/k/") ? "k" : "a";

  /** Farmer Bot URL */
  const FARMER_BOT_URL = import.meta.env.VITE_APP_BOT_URL;

  /** Button Text */
  const JOIN_BUTTON_TEXT_CONTENT = [
    "SUBSCRIBE",
    "REQUEST TO JOIN CHANNEL",
    "REQUEST TO JOIN GROUP",
    "REQUEST TO JOIN",
    "JOIN CHANNEL",
    "JOIN GROUP",
    "JOIN",
  ];
  const CONFIRM_BUTTON_TEXT_CONTENT =
    WEB_VERSION === "k" ? "LAUNCH" : "CONFIRM";
  const CLOSE_BUTTON_TEXT_CONTENT = "CLOSE ANYWAY";

  /** Button Selectors */
  const BUTTON_SELECTORS =
    WEB_VERSION === "k"
      ? {
          launchButton: ".new-message-bot-commands.is-view",
          confirmButton: ".popup-button",
          startButton: ".chat-input-control-button",
          joinButton:
            ".chat-join, .chat-input-control-button, .popup-button.btn.primary",
          webViewButton:
            ".is-web-view, .reply-markup-button.anchor-url.is-link",
        }
      : {
          launchButton: ".bot-menu.open",
          confirmButton: ".confirm-dialog-button",
          startButton: ".join-subscribe-button",
          joinButton: ".join-subscribe-button, .Button.confirm-dialog-button",
          webViewButton:
            "button:has(.icon.icon-webapp), .Button:has(.inline-button-text)",
        };

  /** Observers */
  const OBSERVERS = {};

  /** Click Timeouts */
  const CLICK_TIMEOUTS = {};

  /** Click Telegram Web Button */
  const clickTelegramWebButton = (key, button, timeout = 0) => {
    if (isElementVisible(button)) {
      if (CLICK_TIMEOUTS[key]) {
        clearTimeout(CLICK_TIMEOUTS[key]);
      }

      /** Set Timeout */
      CLICK_TIMEOUTS[key] = setTimeout(() => {
        /** Remove Timeout */
        delete CLICK_TIMEOUTS[key];

        /** Dispatch the Click Event */
        clickElementCenter(button);
      }, timeout);

      return true;
    } else {
      return false;
    }
  };

  const clickNodeOrDescendant = (key, selector, node, verify, timeout) => {
    /** Matches Node */
    if (node.matches(selector) && verify(node)) {
      return clickTelegramWebButton(key, node, timeout);
    }

    /** Descendant Node */
    for (const element of node.querySelectorAll(selector)) {
      if (verify(element) && clickTelegramWebButton(key, element, timeout)) {
        return true;
      }
    }
  };

  /** Is Popup Button */
  const isPopupButton = (element) =>
    [CONFIRM_BUTTON_TEXT_CONTENT, CLOSE_BUTTON_TEXT_CONTENT].includes(
      element.textContent.trim().toUpperCase()
    );

  /** Is it a Start Button */
  const isStartButton = (element) =>
    element.textContent.trim().toUpperCase() === "START";

  /** Is it a Join Button */
  const isJoinButton = (element) =>
    JOIN_BUTTON_TEXT_CONTENT.includes(element.textContent.trim().toUpperCase());

  /** Update Iframe Element */
  const updateIframeElement = (node) => {
    if (!node) return; // Ensure node exists

    /** Get existing permissions, handle null case */
    const permissions = (node.getAttribute("allow") || "")
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);

    /** Add 'fullscreen' only if not already present */
    if (!permissions.includes("fullscreen")) {
      permissions.push("fullscreen");
    }

    /** Remove Sandbox */
    node.removeAttribute("sandbox");

    /** Set updated 'allow' attribute */
    node.setAttribute("allow", permissions.join("; "));

    /** Reload Iframe */
    node.src += "";
  };

  /** Find and Update Iframe */
  const findAndUpdateIframe = (node) => {
    /** Matches Iframe */
    if (node.tagName === "IFRAME") {
      return updateIframeElement(node);
    }

    /** Descendant Iframe */
    for (const element of node.querySelectorAll("iframe")) {
      updateIframeElement(element);
    }
  };

  /** Find And Confirm Popup */
  const findAndConfirmPopup = (node) => {
    return clickNodeOrDescendant(
      "findAndConfirmPopup",
      BUTTON_SELECTORS.confirmButton,
      node,
      isPopupButton
    );
  };

  /** Find And Click Join Button */
  const findAndClickJoinButton = (node) => {
    return clickNodeOrDescendant(
      "findAndClickJoinButton",
      BUTTON_SELECTORS.joinButton,
      node,
      isJoinButton,
      3000
    );
  };

  /** Find And Click Start Button */
  const findAndClickStartButton = (node) => {
    return clickNodeOrDescendant(
      "findAndClickStartButton",
      BUTTON_SELECTORS.startButton,
      node,
      isStartButton,
      5000
    );
  };

  /** Find And Click Launch Button */
  const findAndClickLaunchButton = (node, isWebView) => {
    return clickNodeOrDescendant(
      "findAndClickLaunchButton",
      isWebView
        ? BUTTON_SELECTORS.webViewButton
        : BUTTON_SELECTORS.launchButton,
      node,
      (node) => true,
      1000
    );
  };

  /** Disconnect Observers */
  const disconnectObservers = () => {
    for (const key in OBSERVERS) {
      /** Disconnect Observer */
      OBSERVERS[key].disconnect();

      /** Delete the Key */
      delete OBSERVERS[key];
    }
  };

  /** Join Conversation */
  const joinConversation = () => {
    /** Disconnect Previous Observer */
    disconnectObservers();

    /** Create Observer */
    const observer = new MutationObserver(function (mutationList) {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (findAndClickJoinButton(node)) {
                /** Disconnect */
                return observer.disconnect();
              }
            }
          }
        } else if (mutation.type == "attributes") {
          if (findAndClickJoinButton(mutation.target)) {
            /** Disconnect */
            return observer.disconnect();
          }
        }
      }
    });

    /** Store Observer */
    OBSERVERS["join"] = observer;

    /** Observe */
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    /** Disconnect after timeout */
    setTimeout(() => observer.disconnect(), 20_000);
  };

  /** Open Bot */
  const openBot = (isWebView) => {
    /** Disconnect Previous Observer */
    disconnectObservers();

    /** Create Observer */
    const observer = new MutationObserver(function (mutationList) {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              /** Click Start Button */
              findAndClickStartButton(node);

              /** Click Launch Button */
              if (findAndClickLaunchButton(node, isWebView)) {
                /** Disconnect */
                return observer.disconnect();
              }
            }
          }
        } else if (mutation.type == "attributes") {
          /** Click Start Button */
          findAndClickStartButton(mutation.target);

          /** Click Launch Button */
          if (findAndClickLaunchButton(mutation.target, isWebView)) {
            /** Disconnect */
            return observer.disconnect();
          }
        }
      }
    });

    /** Store Observer */
    OBSERVERS["bot"] = observer;

    /** Observe */
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    /** Disconnect Observer */
    setTimeout(() => observer.disconnect(), 20_000);
  };

  /** Open Farmer Bot */
  const openFarmerBot = () => {
    return openBot();
  };

  /** Observe Page Elements */
  const observePageElements = () => {
    /** Start Observing */
    const observer = new MutationObserver(function (mutationList, observer) {
      for (const mutation of mutationList) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              findAndUpdateIframe(node);
              findAndConfirmPopup(node);
            }
          }
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
    clickElementCenter(
      iframe.parentElement.previousElementSibling.querySelector(".popup-close")
    );
  };

  /** Close Other Popups */
  const closeOtherPopups = () => {
    const iframes = document.querySelectorAll(
      ".popup-body.web-app-body iframe"
    );
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
    name: `telegram-web-${WEB_VERSION}`,
  });

  /** Listen for Port Message */
  port.onMessage?.addListener(async (message) => {
    const { id, action, data } = message;

    const reply = (data) => {
      port.postMessage({
        id,
        data,
      });
    };

    switch (action) {
      case "get-local-storage":
        try {
          reply(localStorage);
        } catch (e) {
          console.error(e);
        }
        break;

      case "set-local-storage":
        Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
        try {
          reply(true);
        } catch (e) {
          console.error(e);
        }
        break;
      case "disconnect-observers":
        await disconnectObservers();
        try {
          reply(true);
        } catch (e) {
          console.error(e);
        }
        break;

      case "close-other-popups":
        await closeOtherPopups();
        try {
          reply(true);
        } catch (e) {
          console.error(e);
        }
        break;

      case "open-webview-bot":
        await openBot(true);
        try {
          reply(true);
        } catch (e) {
          console.error(e);
        }
        break;

      case "open-farmer-bot":
        await openFarmerBot();
        try {
          reply(true);
        } catch (e) {
          console.error(e);
        }
        break;

      case "join-conversation":
        await joinConversation();
        try {
          reply(true);
        } catch (e) {
          console.error(e);
        }
        break;
    }
  });

  /** Handle Viewport */
  window.addEventListener("message", (ev) => {
    if (typeof ev.data !== "string") return;

    let event;
    try {
      event = JSON.parse(ev.data);
    } catch (e) {
      return;
    }

    const { eventType } = event || {};
    if (!eventType) return;

    switch (eventType) {
      case "web_app_request_viewport":
        ev.source.postMessage(
          JSON.stringify({
            eventType: "viewport_changed",
            eventData: {
              height: 600,
              is_state_stable: false,
              is_expanded: true,
            },
          }),
          "*"
        );
        break;
    }
  });

  /** Observe Page Elements */
  observePageElements();
}
