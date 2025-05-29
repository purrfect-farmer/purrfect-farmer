import "@/lib/polyfills";

import { Api } from "telegram";
import { NewMessage, Raw } from "telegram/events";
import { UpdateConnectionState } from "telegram/network";

import { createTelegramClient } from "./createTelegramClient";
import { customLogger, extractTgWebAppData, parseTelegramLink } from "./utils";

/** @type {import("telegram").TelegramClient | null} */
let client = null;

/** Start Handlers */
let handlers = {
  phone: null,
  code: null,
  password: null,
  error: null,
};

/**
 * Executes a callback with the Telegram Client instance.
 *
 * @param {(client: import("telegram").TelegramClient) => any} callback - The function to execute with the client.
 * @returns {Promise<any>} The result of the callback.
 */
const execute = async (callback) => {
  if (client === null) {
    throw new Error("No Telegram Client!");
  }

  /** Connect  */
  await client.connect();

  /** Ensure User is Authorized  */
  if (await client.isUserAuthorized()) {
    return callback(client);
  }
};

/** Wait for Reply */
const waitForReply =
  /**
   * @param {import("telegram").TelegramClient} client
   */
  (client, entity, { filter } = {}) =>
    new Promise((resolve) => {
      /** Event to Handle */
      const eventToHandle = new NewMessage({
        fromUsers: [entity],
      });

      /**
       * @param {import("telegram/events").NewMessageEvent} event
       */
      const handler = (event) => {
        customLogger("BOT RECEIVED MESSAGE", event);

        if (typeof filter === "undefined" || filter(event.message)) {
          client.removeEventHandler(handler, eventToHandle);
          resolve(event.message);
        }
      };

      /** Add Event */
      client.addEventHandler(handler, eventToHandle);
    });

/** Base Start Bot */
const baseStartBot =
  /**
   * @param {import("telegram").TelegramClient} client
   */
  async (
    client,
    { entity, startParam = "", shouldWaitForReply = true } = {},
    replyOptions
  ) => {
    /** Start the Bot */
    const result = await client.invoke(
      new Api.messages.StartBot({
        bot: entity,
        peer: entity,
        startParam: startParam,
      })
    );

    /** Log Bot Start */
    customLogger("START BOT", result);

    /** Wait for Reply */
    if (shouldWaitForReply) {
      return waitForReply(client, entity, replyOptions);
    }
  };

/** Start Bot from Link */
const startBotFromLink = ({ link, startOptions, replyOptions }) =>
  execute((client) => {
    const { entity, startParam } = parseTelegramLink(link);
    return baseStartBot(
      client,
      {
        ...startOptions,
        entity,
        startParam,
      },
      replyOptions
    );
  });

/** Get Entity */
const getEntity = (link) =>
  execute(
    /**
     * @param {import("telegram").TelegramClient} client
     */
    async (client) => {
      const parsed = parseTelegramLink(link);
      const entity = await client.getEntity(parsed.entity);
      const buffer = await client.downloadProfilePhoto(entity, {
        isBig: false,
      });
      const result = {
        entity,
        profilePhoto: `data:image/jpeg;base64,${buffer.toString("base64")}`,
      };

      /** Entity */
      customLogger("ENTITY", {
        link,
        result,
      });

      return result;
    }
  );

/** Get Webview */
const getWebview = (link) =>
  execute(async (client) => {
    let parsed = parseTelegramLink(link);
    let url;
    const themeParams = new Api.DataJSON({
      data: JSON.stringify({
        bg_color: "#ffffff",
        text_color: "#000000",
        hint_color: "#aaaaaa",
        link_color: "#006aff",
        button_color: "#2cab37",
        button_text_color: "#ffffff",
      }),
    });

    /** Start the Bot */
    if (!parsed.shortName) {
      await baseStartBot(
        client,
        {
          entity: parsed.entity,
          startParam: parsed.startParam,
        },
        {
          filter(message) {
            const buttons = message
              ? message.buttons
                  .flat()
                  .map((item) => item.button)
                  .filter((button) => Boolean(button.url))
              : null;

            if (buttons) {
              for (const button of buttons) {
                if (isTelegramLink(button.url) === false) {
                  url = button.url;
                  return true;
                } else {
                  const parsedTelegramLink = parseTelegramLink(button.url);

                  if (
                    parsed.entity.toLowerCase() ===
                      parsedTelegramLink.entity.toLowerCase() &&
                    parsedTelegramLink.shortName
                  ) {
                    parsed.shortName = parsedTelegramLink.shortName;
                    return true;
                  }
                }
              }
            }
          },
        }
      );
    }

    const result = await client.invoke(
      url
        ? new Api.messages.RequestWebView({
            url,
            platform: "android",
            bot: parsed.entity,
            peer: parsed.entity,
            startParam: parsed.startParam,
            themeParams,
          })
        : new Api.messages.RequestAppWebView({
            platform: "android",
            peer: parsed.entity,
            startParam: parsed.startParam,
            app: new Api.InputBotAppShortName({
              botId: await client.getInputEntity(parsed.entity),
              shortName: parsed.shortName,
            }),
            themeParams,
          })
    );

    /** Webview */
    customLogger("WEBVIEW", {
      link,
      result,
    });

    return result;
  });

/** Get Telegram WebApp */
const getTelegramWebApp = async (link) => {
  const webview = await getWebview(link);
  const result = extractTgWebAppData(webview.url);

  /** Log */
  customLogger("TELEGRAM WEB APP", {
    link,
    result,
  });

  return result;
};

/** Join Telegram Link */
const joinTelegramLink = (link) =>
  execute(async (client) => {
    try {
      const parsed = parseTelegramLink(link);
      const result = await client.invoke(
        parsed.entity.startsWith("+")
          ? new Api.messages.ImportChatInvite({
              hash: parsed.entity.replace("+", ""),
            })
          : new Api.channels.JoinChannel({
              channel: parsed.entity,
            })
      );

      /** Log */
      customLogger("JOINED CHANNEL", {
        link,
        result,
      });

      /** Return Result */
      return result;
    } catch (error) {
      if (
        error.message.includes("USER_ALREADY_PARTICIPANT") === false &&
        error.message.includes("INVITE_REQUEST_SENT") === false
      ) {
        throw error;
      }
    }
  });

const createHandler = (name) => (data) =>
  new Promise((resolve, reject) => {
    console.log("Handling:", name);

    /** Set Handler */
    handlers[name] = ({ result, error }) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };
    postMessage({
      action: "handler-" + name,
      data,
    });
  });

const startClient = async () => {
  if (client === null) {
    throw new Error("No Telegram Client!");
  }

  return client
    .start({
      phoneNumber: createHandler("phone"),
      phoneCode: createHandler("code"),
      password: createHandler("password"),
      onError: createHandler("error"),
    })
    .then(() => client.session.save());
};

/** Initialize Client */
const initializeClient = (session) => {
  /** Create client */
  client = createTelegramClient(session);

  /** Add Connected Event Handler */
  client.addEventHandler(
    (event) => {
      postMessage({
        action: "update-connection-state",
        data: event.state === UpdateConnectionState.connected,
      });
    },
    new Raw({
      types: [UpdateConnectionState],
    })
  );
};

/** Listen for Message */
addEventListener("message", async (ev) => {
  const { id, action, data } = ev.data;

  /** Reply */
  const reply = async (response) => {
    try {
      const result = await response;
      postMessage({
        id,
        data: {
          result,
        },
      });
    } catch (error) {
      /** Log Error */
      console.error(error);

      postMessage({
        id,
        data: { error: { message: error?.message || "An error occurred!" } },
      });
    }
  };

  /**
   * Executes a callback with the Telegram Client instance.
   *
   * @param {(client: import("telegram").TelegramClient) => any} callback - The function to execute with the client.
   * @returns {Promise<any>} The result of the callback.
   */
  const replyClientMethod = (callback) => {
    if (client) {
      reply(callback(client));
    } else {
      reply(false);
    }
  };

  switch (action) {
    case "initialize-client":
      /** Initialize Client */
      initializeClient();

      /** Reply */
      reply(true);
      break;

    /** Start Client */
    case "start-client":
      reply(startClient());
      break;

    case "handler-phone":
    case "handler-code":
    case "handler-password":
    case "handler-error":
      const handler = handlers[action.split("-")[1]];

      if (handler) {
        handler(data);
      }
      break;

    case "join-telegram-group":
      reply(joinTelegramLink(data));
      break;

    case "start-bot-from-link":
      reply(startBotFromLink(data));
      break;

    case "get-telegram-web-app":
      reply(getTelegramWebApp(data));
      break;

    case "get-webview":
      reply(getWebview(data));
      break;

    case "get-entity":
      reply(getEntity(data));
      break;

    case "get-connection-state":
      replyClientMethod((client) => client.connected);
      break;

    case "is-user-authorized":
      replyClientMethod((client) => client.isUserAuthorized());
      break;

    case "connect":
      replyClientMethod((client) => client.connect());
      break;

    case "disconnect":
      replyClientMethod((client) => client.disconnect());
      break;

    case "logout":
      replyClientMethod((client) => client.invoke(new Api.auth.LogOut({})));
      break;
  }
});
