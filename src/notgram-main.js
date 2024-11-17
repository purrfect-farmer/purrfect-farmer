import { decryptData, encryptData } from "./content-script-utils";
import {
  delay,
  delayForSeconds,
  dispatchClickEventOnElement,
  logNicely,
  scrollElementIntoView,
} from "./lib/utils";

const core = {
  open: window.open.bind(window),
};

const modifiedWindowOpen = (url) => {
  if (url.startsWith("https://t.me/")) {
    window.postMessage(
      {
        type: "port",
        payload: encryptData({
          action: "handle-link",
          data: {
            url,
          },
        }),
      },
      "*"
    );
  }

  logNicely("NOTGRAM LINK", url);
};

let PROCESS_HAS_STARTED = false;

const startTasks = async () => {
  if (PROCESS_HAS_STARTED) return;
  /** Start */
  PROCESS_HAS_STARTED = true;
  window.open = modifiedWindowOpen;

  const tasksLink = getTasksAnchorLink();

  try {
    if (tasksLink) {
      /** Click Tasks */
      dispatchClickEventOnElement(tasksLink);

      /** Delay */
      await delay(1000);

      /** Buttons */
      const tabButtons = getButtonsTabs();

      for (let i = tabButtons.length - 1; i >= 0; i--) {
        const button = tabButtons[i];

        /** Click Special */
        dispatchClickEventOnElement(button);

        /** Delay */
        await delay(1000);

        /** Run Tasks */
        try {
          await runTasks();
        } catch {}
      }
    }
  } catch {}

  /** Stop Tasks */
  stopTasks();

  /** Notify Farmer */
  window.postMessage(
    {
      type: "port",
      payload: encryptData({
        action: "completed-tasks",
      }),
    },
    "*"
  );
};

const runTasks = async () => {
  /** Tasks */
  const tasks = getTasks();

  for (let task of tasks) {
    /** Stop When Not Started */
    if (!PROCESS_HAS_STARTED) return;

    /** Bring Into View  */
    scrollElementIntoView(task);

    /** Buttons */
    const buttons = task.querySelectorAll("button");

    /** Skip when there's no button */
    if (!buttons.length) continue;

    /** Buttons */
    const [performButton, verifyButton, claimButton] = buttons;

    /** Needs to Perform Task */
    if (verifyButton.disabled) {
      /** Log */
      logNicely("NOTGRAM", "Performing Task");

      /** Click */
      dispatchClickEventOnElement(performButton);

      /** Delay */
      await delayForSeconds(15);
    }

    /** Can Verify */
    if (!verifyButton.disabled) {
      /** Log */
      logNicely("NOTGRAM", "Verifying Task");

      /** Click to Verify */
      dispatchClickEventOnElement(verifyButton);

      /** Delay */
      await delayForSeconds(10);
    }

    /** Can Claim */
    if (claimButton && !claimButton.disabled) {
      /** Log */
      logNicely("NOTGRAM", "Claiming Task");

      /** Click to Claim */
      dispatchClickEventOnElement(claimButton);

      /** Delay */
      await delayForSeconds(3);
    }

    /** Close Popup */
    closePopup();

    /** Delay */
    await delayForSeconds(5);
  }

  /** Delay */
  await delay(1000);
};

/** Close Popup */
const closePopup = () => {
  const confirmButton = document.querySelector(
    ".fixed.visible button.bg-bronze"
  );

  if (confirmButton) {
    dispatchClickEventOnElement(confirmButton);
  }
};

/** Stop Tasks */
const stopTasks = () => {
  window.open = core.open;
  PROCESS_HAS_STARTED = false;
};

const getButtonsTabs = () => {
  return document.querySelectorAll(
    ".w-full.flex.items-center.justify-between.border-cards > div"
  );
};

const getTasks = () => {
  return document.querySelectorAll(
    [
      "#refer > .block > div.bg-cards",
      "#refer > .block > div.bg-gradient-to-r > div",
    ].join(",")
  );
};

const getTasksAnchorLink = () => {
  for (const element of document.querySelectorAll("#footermain a")) {
    if (element.getAttribute("href") === "/tasks") {
      return element;
    }
  }
};

/** Handle Messages */
window.addEventListener("message", (ev) => {
  try {
    if (
      ev.source === window &&
      ev.data?.type === "request" &&
      ev.data?.payload
    ) {
      const { id, payload } = ev.data;
      const { action, data } = decryptData(payload);

      switch (action) {
        case "custom:start-tasks":
          /** Post Message */
          window.postMessage(
            {
              id,
              type: "response",
              payload: encryptData({
                status: true,
              }),
            },
            "*"
          );

          /** Start Tasks */
          startTasks();
          break;

        case "custom:stop-tasks":
          /** Post Message */
          window.postMessage(
            {
              id,
              type: "response",
              payload: encryptData({
                status: true,
              }),
            },
            "*"
          );

          /** Stop Tasks */
          stopTasks();
          break;
      }
    }
  } catch {}
});
