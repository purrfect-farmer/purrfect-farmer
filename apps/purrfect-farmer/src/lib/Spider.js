import axios from "axios";
import { TelegramClient } from "telegram";

import { MemorySession, StringSession } from "telegram/sessions";
import { NewMessage, NewMessageEvent } from "telegram/events";
import {
  TELEGRAM_API_HASH,
  TELEGRAM_API_ID,
  acceptLoginToken,
  finalizeLoginToken,
  requestLoginToken,
} from "@purrfect/shared/utils/loginToken.js";

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

  /** Create Telegram Client */
  createTelegramClient(session) {
    return new TelegramClient(session, TELEGRAM_API_ID, TELEGRAM_API_HASH, {
      appVersion: "2.2 K",
      systemLangCode: "en-US",
      langCode: "en",
      deviceModel: navigator.userAgent,
      systemVersion: navigator.platform,
    });
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

  /** Get Local Telegram Session via Login Code */
  async getLocalTelegramSessionViaLoginCode({ telegram, account, twoFA }) {
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

  /**
   * Get Local Telegram Session via Exported Login Token
   *
   * This is the QR-login handshake: the new client exports a login token,
   * the already-authorized client from `getTelegramAccount` accepts it, and
   * the new client re-exports to receive its own authorization. No second
   * login code is requested, so there is nothing to wait for or scrape.
   */
  async getLocalTelegramSessionViaLoginToken({ telegram, account, twoFA }) {
    const client = this.createTelegramClient(new StringSession());
    let used2FA = false;

    /* Destroy Client */
    const destroyClient = async () => {
      try {
        await client.destroy();
      } catch (e) {
        console.error("Error destroying local client:", e);
      }
    };

    /**
     * Prefer the password we just rotated to in `getTelegramAccount`,
     * and fall back to the one Spider supplied.
     */
    const passwords = [twoFA, telegram.authResult?.["password"]].filter(
      Boolean
    );

    try {
      /* Connect Without Authenticating */
      await client.connect();

      /* Export Login Token */
      console.log("Exporting login token...");
      const exported = await requestLoginToken(client);

      /* Accept the Token on the Already-Authorized Client */
      console.log("Accepting login token on the authorized client...");
      await acceptLoginToken(telegram.client, exported.token);

      /* Collect the Authorization (handling DC migration and 2FA) */
      await finalizeLoginToken(client, {
        getPassword: (attempt) => {
          const password = passwords[attempt];

          if (!password) return null;

          /* Indicate 2FA Was Used */
          used2FA = true;

          /* Log Password Usage */
          console.log("Using 2FA password for login token:", password);

          return password;
        },
      });

      console.log("Logged in locally via login token");
    } catch (error) {
      await destroyClient();
      throw error;
    }

    /* Save Session Before Destroying the Client */
    const session = client.session.save();

    await destroyClient();

    return {
      account,
      used2FA,
      session,
    };
  }

  /**
   * Get Local Telegram Session
   *
   * `method` picks the login strategy:
   * - "token" - exported login token only
   * - "code"  - login code only
   * - "auto"  - token first, falling back to the login code (default)
   */
  async getLocalTelegramSession({ telegram, account, twoFA, method = "auto" }) {
    if (method === "code") {
      return this.getLocalTelegramSessionViaLoginCode({
        telegram,
        account,
        twoFA,
      });
    }

    try {
      return await this.getLocalTelegramSessionViaLoginToken({
        telegram,
        account,
        twoFA,
      });
    } catch (error) {
      if (method === "token") {
        throw error;
      }

      /* Fall Back to the Login Code */
      console.warn("Login token failed, falling back to the login code:", error);

      return this.getLocalTelegramSessionViaLoginCode({
        telegram,
        account,
        twoFA,
      });
    }
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
        enableLocalTelegramSession,
        countryCode,
        twoFA,
      };
    } catch (error) {
      console.error("Error purchasing account:", error);
      return { success: false, error: error.message };
    }
  }
}
