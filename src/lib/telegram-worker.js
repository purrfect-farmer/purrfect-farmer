import "@/lib/polyfills";

import TelegramWebClient from "./TelegramWebClient";

/** @type {TelegramWebClient | null} */
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
 * @param {(client: TelegramWebClient) => any} callback - The function to execute with the client.
 * @returns {Promise<any>} The result of the callback.
 */
const execute = async (callback) => {
  if (client === null) {
    throw new Error("No Telegram Client!");
  }

  return callback(client);
};

/** Start Bot from Link */
const startBotFromLink = (options) =>
  execute((client) => client.startBotFromLink(options));

/** Get Webview */
const getWebview = (link) => execute((client) => client.getWebview(link));

/** Get Telegram WebApp */
const getTelegramWebApp = (link) =>
  execute((client) => client.getTelegramWebApp(link));

/** Join Telegram Link */
const joinTelegramLink = (link) =>
  execute(async (client) => client.joinTelegramLink(link));

/** Create Handler */
const createHandler = (name) => (data) =>
  new Promise((resolve, reject) => {
    /** Log Handler Name */
    console.log("Handling:", name);

    /** Set Handler */
    handlers[name] = ({ result, error }) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };

    /** Get Handler Data */
    postMessage({
      action: "handler-" + name,
      data,
    });
  });

/** Start Client */
const startClient = async () => {
  return execute((client) =>
    client.start({
      phoneNumber: createHandler("phone"),
      phoneCode: createHandler("code"),
      password: createHandler("password"),
      onError: createHandler("error"),
    })
  );
};

/** Initialize Client */
const initializeClient = (session) => {
  /** Create client */
  client = new TelegramWebClient(session);

  /** Add Connected Event Handler */
  client.onConnectionState((connected) => {
    postMessage({
      action: "update-connection-state",
      data: connected,
    });
  });
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
   * @param {(client: TelegramWebClient) => any} callback - The function to execute with the client.
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
      replyClientMethod((client) => client.logout());
      break;
  }
});
