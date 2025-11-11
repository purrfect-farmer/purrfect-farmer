import axios from "axios";
import { TelegramClient } from "telegram";

import { MemorySession, StringSession } from "telegram/sessions";
import { NewMessage, NewMessageEvent } from "telegram/events";

export default class Spider {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = "https://api.spider-service.com";

    /* Axios Instance */
    this.api = axios.create({
      baseURL: this.baseUrl,
    });

    /* Add API Key to Requests */
    this.api.interceptors.request.use((config) => {
      const url = new URL(config.url, config.baseURL);
      url.searchParams.set("apiKay", this.apiKey);

      return { ...config, url: url.pathname + url.search };
    });
  }

  /** Make Action Request */
  makeAction(action, params = {}) {
    return this.api
      .get("/?" + new URLSearchParams({ action, ...params }).toString())
      .then((res) => res.data.result);
  }

  /** Get Balance */
  getBalance() {
    return this.makeAction("getBalance");
  }

  /** Get Info */
  getInfo() {
    return this.makeAction("getInfo");
  }

  /** Get Countries */
  getCountries() {
    return this.makeAction("getCountrys");
  }

  /** Get Number */
  getNumber(countryCode) {
    return this.makeAction("getNumber", { country: countryCode });
  }

  /** Get Code */
  getCode(hashCode) {
    return this.makeAction("getCode", { ["hash_code"]: hashCode });
  }

  /** Get Wallet */
  getWallet() {
    return this.makeAction("wallet");
  }

  createTelegramClient(session) {
    return new TelegramClient(
      session,
      2496,
      "8da85b0d5bfe62527e5b244c209159c3",
      {
        appVersion: "2.2 K",
        systemLangCode: "en-US",
        langCode: "en",
        deviceModel:
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        systemVersion: "Linux x86_64",
      }
    );
  }

  /** Get Telegram Account */
  async getTelegramAccount({ account, twoFA }) {
    return new Promise(async (resolve, reject) => {
      try {
        let authResult = null;
        let used2FA = false;
        const session = new MemorySession();
        const client = this.createTelegramClient(session);

        /* Start Client and Authenticate */
        await client.start({
          phoneNumber: async () => account["phone"],
          phoneCode: async () => {
            /* Get Code */
            authResult = await this.getCode(account["hash_code"]);

            /* Log Received Auth Result */
            console.log("Received auth result:", authResult);

            /* Return Code */
            return authResult["code"];
          },
          password: async () => {
            /* Indicate 2FA Was Used */
            used2FA = true;

            /* Log Password Usage */
            console.log(
              "Using 2FA password from Spider:",
              authResult["password"]
            );

            /* Return Password */
            return authResult["password"];
          },
          onError: (err) => reject(err),
        });

        /* Extract Session Details */
        const authKey = client.session.authKey.getKey().toString("hex");
        const dcId = client.session.dcId;

        /* Log Successful Login */
        console.log("Successfully logged in to Telegram");

        console.log("Auth Key:", authKey);
        console.log("DC ID:", dcId);

        const user = await client.getMe();
        console.log("Logged in as", user.username || user.firstName);

        if (twoFA || used2FA) {
          console.log("Updating 2FA settings...");
          await client.updateTwoFaSettings({
            currentPassword: used2FA ? authResult["password"] : undefined,
            newPassword: twoFA || undefined,
            email: "",
            hint: "",
          });
        }

        return resolve({
          account,
          authResult,
          used2FA,
          user,
          client,
          authKey,
          dcId,
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  /** Get Local Telegram Session */
  async getLocalTelegramSession({ telegram, account, twoFA }) {
    return new Promise(async (resolve, reject) => {
      try {
        const session = new StringSession();
        const client = this.createTelegramClient(session);

        let authCodeMessage = null;
        let used2FA = false;

        /* Add New Message Handler to the SAME client before connecting */
        telegram.client.addEventHandler(
          /**
           * @param {NewMessageEvent} event
           */
          (event) => {
            console.log("New message event received:", event.message);
            const message = event.message?.message || "";
            const match = message.match(/(\d{5})/);

            if (match) {
              authCodeMessage = match[1];
              console.log("Extracted auth code:", authCodeMessage);
            }
          },
          new NewMessage({
            fromUsers: [777000] /* Telegram Service Notifications */,
          })
        );

        /* Request auth code via Telegram (this will trigger the message) */
        console.log("Requesting SMS code via Telegram...");

        /* Start Client and Authenticate */
        await client.start({
          phoneNumber: async () => account["phone"],
          phoneCode: async () => {
            return new Promise((resolveCode, rejectCode) => {
              /* Check if we already have the code */
              if (authCodeMessage) {
                return resolveCode(authCodeMessage);
              }

              /* Wait for the auth code message */
              console.log("Waiting for auth code message from Telegram...");

              let attempts = 0;
              let interval = setInterval(() => {
                attempts += 1;
                if (authCodeMessage) {
                  clearInterval(interval);
                  return resolveCode(authCodeMessage);
                }

                if (attempts >= 10) {
                  clearInterval(interval);
                  return rejectCode(new Error("Auth code timeout"));
                }
              }, 5000);
            });
          },
          password: async () => {
            /* Indicate 2FA Was Used */
            used2FA = true;

            /* Log Password Usage */
            console.log("Using 2FA password from Spider:", twoFA);

            /* Return Password */
            return twoFA;
          },
          onError: (err) => reject(err),
        });

        /* Destroy Client */
        try {
          await client.destroy();
        } catch (e) {
          console.error("Error destroying local client:", e);
        }

        return resolve({
          account,
          used2FA,
          session: client.session.save(),
        });
      } catch (error) {
        return reject(error);
      }
    });
  }

  /** Purchase Account */
  async purchaseAccount({ countryCode, twoFA, enableLocalTelegramSession }) {
    try {
      /* Get Number from Spider */
      const account = await this.getNumber(countryCode);

      /* Validate Account */
      if (!account?.["phone"]) {
        throw new Error(
          "No account returned from Spider for country " + countryCode
        );
      }

      /* Log Acquired Account */
      console.log("Acquired account:", account);

      /* Login to Telegram via Spider */
      const telegram = await this.getTelegramAccount({ account, twoFA });

      /* Log Telegram Results */
      console.log("Telegram results:", telegram);

      let localTelegram = null;
      if (enableLocalTelegramSession) {
        /* Log In to Telegram Locally to Get Session */
        localTelegram = await this.getLocalTelegramSession({
          telegram,
          account,
          twoFA,
        });

        /* Log Local Telegram Results */
        console.log("Local Telegram results:", localTelegram);
      }

      /* Destroy Main Client */
      try {
        await telegram.client.destroy();
      } catch (e) {
        console.error("Error destroying main client:", e);
      }

      /* Prepare Telegram Web Local Storage */
      const telegramWebLocalStorage = Object.fromEntries(
        Object.entries({
          ["account1"]: {
            ["dcId"]: telegram.dcId,
            [`dc${telegram.dcId}_auth_key`]: telegram.authKey,
            ["dc2_auth_key"]: telegram.authKey /* Patch for Web-K */,
            ["userId"]: telegram.user.id.toString(),
            ["auth_key_fingerprint"]: telegram.authKey.slice(0, 8),
          },
        }).map(([key, value]) => [key, JSON.stringify(value)])
      );

      /* Prepare Local Telegram Session */
      const localTelegramSession = enableLocalTelegramSession
        ? localTelegram.session
        : null;

      /* Return Purchase Result */
      const { user, authKey, dcId } = telegram;

      return {
        success: true,
        account,
        user,
        dcId,
        authKey,
        telegramWebLocalStorage,
        localTelegramSession,
      };
    } catch (error) {
      console.error("Error purchasing account:", error);
      return { success: false, error: error.message };
    }
  }
}
