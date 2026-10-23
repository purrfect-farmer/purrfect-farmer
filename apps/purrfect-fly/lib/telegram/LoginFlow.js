import {
  finalizeLoginToken,
  requestLoginToken,
} from "@purrfect/shared/utils/loginToken.js";

import { LOGIN_STAGE } from "../../enums/login-stage.js";

/** An unfinished login is logged out after this long */
const LOGIN_TIMEOUT = 10 * 60 * 1000;

/** Step-by-step login state machine, answered one stage per request */
export default class LoginFlow {
  /** @param {import("./GramClient.js").default} client */
  constructor(client) {
    this.client = client;
    this.timeout = null;
    this.reset();
  }

  /** Forget the current stage and its handlers */
  reset() {
    this.stage = null;
    this.stagePromise = null;
    this.handlers = {
      [LOGIN_STAGE.PHONE]: null,
      [LOGIN_STAGE.CODE]: null,
      [LOGIN_STAGE.PASSWORD]: null,
      [LOGIN_STAGE.TOKEN]: null,
    };
  }

  /** A gramjs callback that reports `stage` and waits for the client's answer */
  createHandler(stage, extra = null) {
    return () =>
      new Promise((resolve) => {
        this.stagePromise?.resolve?.({ stage, ...extra });

        if (this.stage) {
          delete this.handlers[this.stage];
        }

        this.stage = stage;

        /** Answering resolves this stage and waits for the next one */
        this.handlers[stage] = (data) => {
          resolve(data);

          return new Promise((_resolve, _reject) => {
            this.stagePromise = { resolve: _resolve, reject: _reject };
          });
        };
      });
  }

  /** Answer the current stage */
  async respond(stage, response) {
    if (this.stage !== stage) {
      throw new Error("Invalid stage!");
    } else if (!this.handlers[stage]) {
      throw new Error("Missing stage handler!");
    } else {
      return await this.handlers[stage](response);
    }
  }

  /** Reject whoever is waiting on the current stage */
  reject(error) {
    this.stagePromise?.reject?.(error);
  }

  /** Stop the automatic logout */
  clearTimeout() {
    clearTimeout(this.timeout);
  }

  /** Arm the automatic logout and wait for the first stage */
  begin(resolve, reject) {
    this.timeout = setTimeout(() => {
      this.client.logout().catch((error) => {
        console.error("Error during automatic logout:", error);
      });
    }, LOGIN_TIMEOUT);

    this.reset();
    this.stagePromise = { resolve, reject };
  }

  /** Save the session and report the authenticated user */
  async complete() {
    const user = await this.client.getMe();

    await this.client.saveSession();
    await this.client.destroy();

    this.stagePromise?.resolve?.({ stage: LOGIN_STAGE.AUTHENTICATED, user });
  }

  /** Log in with phone, code and password */
  startWithPhone() {
    return new Promise((resolve, reject) => {
      this.begin(resolve, reject);

      this.client
        .start({
          phoneNumber: this.createHandler(LOGIN_STAGE.PHONE),
          phoneCode: this.createHandler(LOGIN_STAGE.CODE),
          password: this.createHandler(LOGIN_STAGE.PASSWORD),
          onError: (error) => {
            if (this.stagePromise) {
              this.stagePromise.reject(error);
            } else {
              console.error(
                "Error occurred before handler was initialized:",
                error,
              );
            }
          },
        })
        .then(async () => {
          try {
            await this.complete();
          } catch (error) {
            console.error("Error during authentication process:", error);
            this.reject(error);
          } finally {
            this.reset();
          }
        })
        .catch((error) => this.reject(error))
        .finally(() => this.clearTimeout());
    });
  }

  /** Log in by handing out a login token for another device to accept */
  startWithToken() {
    return new Promise((resolve, reject) => {
      this.begin(resolve, reject);

      (async () => {
        if (this.client.disconnected) {
          await this.client.connect();
        }

        const exported = await requestLoginToken(this.client);

        /** Hand the token over and wait for the acceptance to be reported */
        await this.createHandler(LOGIN_STAGE.TOKEN, {
          token: exported.token.toString("base64"),
        })();

        /** Collect the authorization, handling DC migration and 2FA */
        await finalizeLoginToken(this.client, {
          getPassword: this.createHandler(LOGIN_STAGE.PASSWORD),
        });

        await this.complete();
      })()
        .catch((error) => {
          console.error("Error during login token authentication:", error);
          this.reject(error);
        })
        .finally(() => {
          this.reset();
          this.clearTimeout();
        });
    });
  }
}
