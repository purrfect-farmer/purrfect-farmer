import {
  DEVICE_ID_MODE,
  MAX_CAPTCHA_ATTEMPTS,
  MAX_LOGIN_ATTEMPTS,
  SHOULD_SOLVE_CAPTCHA_BEFORE_LOGIN,
} from "./constants.js";
import BaseFarmer from "../../lib/BaseFarmer.js";

/** Device id, API setup, captcha and login */
export default class ATFSession extends BaseFarmer {
  /** Get Referral Link */
  getReferralLink() {
    return `https://t.me/ATF_AIRDROP_bot?start=${this.getUserId()}`;
  }

  /** Get or create device ID */
  getOrCreateDeviceId() {
    if (!this.deviceId) {
      const mode = DEVICE_ID_MODE;

      if (mode === "unique") {
        /* Seeded by the user, so the device ID stays the same across runs */
        const random = this.getUserRandomGenerator();
        const hex = (length) =>
          Array.from({ length }, () =>
            Math.floor(random() * 16).toString(16),
          ).join("");

        const variant = (8 + Math.floor(random() * 4)).toString(16);

        this.deviceId = `dev-${hex(8)}-${hex(4)}-4${hex(3)}-${variant}${hex(
          3,
        )}-${hex(12)}`;
      } else {
        this.deviceId = `dev-${this.utils.uuid()}`;
      }
    }

    return this.deviceId;
  }

  /** Configure API */
  configureApi() {
    const headersInterceptor = this.api.interceptors.request.use((config) => {
      const url = new URL(config.url, config.baseURL);
      url.searchParams.set("t", Date.now().toString());
      config.url = url.toString();
      Object.assign(config.headers, this.getAuthHeaders());

      config.data = {
        request_id: this.makeRequestId(),
        device_id: this.getOrCreateDeviceId(),
        ...config.data,
        initData: this.getInitData(),
        tg_id: this.getUserId(),
      };
      return config;
    });

    return () => {
      this.api.interceptors.request.eject(headersInterceptor);
    };
  }

  /** Get Auth */
  async fetchAuth() {
    return this.login();
  }

  /** Solve Captcha */
  async solveCaptcha() {
    /* Check if captcha has already been solved */
    if (this.has_solved_captcha) {
      return;
    }

    /* Attempts */
    let attempts = 0;

    this.logger.info("Solving captcha...");
    while (true) {
      if (this.signal.aborted) {
        throw new Error("Captcha solving aborted");
      }

      const captchaStatus = await this.getCaptchaStatus();
      const isDegradedOrCircuitOpen =
        captchaStatus.degraded || captchaStatus.reason === "db_circuit_open";

      if (isDegradedOrCircuitOpen) {
        await this.utils.delayForSeconds(5, { signal: this.signal });
        attempts++;
        if (attempts > MAX_CAPTCHA_ATTEMPTS) {
          throw new Error("Failed to get captcha status");
        }
        continue;
      }

      if (captchaStatus.captcha_required) {
        if (!this.canSolveTurnstile()) {
          throw new Error(
            "Captcha is required but no captcha provider is configured!",
          );
        }

        try {
          /* Solve ReCaptcha */
          const captchaToken = await this.solveTurnstile({
            siteKey: captchaStatus.site_key,
            pageUrl: "https://atfminers.asloni.online/miner/index.html",
          });

          /* Verify Captcha */
          const captchaResponse = await this.verifyEntryCaptcha(captchaToken);

          if (captchaResponse.status !== "success") {
            throw new Error(
              "Failed to verify captcha:",
              captchaResponse.message,
            );
          }
        } catch (error) {
          this.logger.error("Failed to solve captcha:", error);
          throw error;
        }
      } else {
        break;
      }
    }

    /* Update captcha solved status */
    this.has_solved_captcha = true;
  }

  /** The drop can answer a login with an image captcha instead of the account, as a 200 or a 4xx body */
  getEntryRiskChallenge(payload) {
    return payload?.["reason"] === "entry_risk_captcha_required" &&
      payload?.["captcha_image"]
      ? payload
      : null;
  }

  /** Answer one entry risk challenge, letting the login loop mint a new image for a refused answer
   * @returns {Promise<boolean>} whether the challenge was verified
   */
  async solveEntryRiskCaptcha(challenge) {
    if (this.signal.aborted) {
      throw new Error("Captcha solving aborted");
    }

    /** An answer submitted against an expiring challenge is wasted */
    const expiresIn = Number(challenge["expires_in"]);

    if (Number.isFinite(expiresIn) && expiresIn <= 5) {
      this.logger.warn("Entry risk captcha expired, asking for a new one...");
      return false;
    }

    const answer = await this.resolveImageCaptchaAnswer({
      image: challenge["captcha_image"],
      promptText: challenge["message"] || "Solve the captcha to sign in:",
      label: "entry risk captcha",
    });

    /** A wrong answer is refused with a 403 carrying the reason */
    let result;

    try {
      result = await this.verifyEntryRiskCaptcha({
        challengeId: challenge["challenge_id"],
        answer,
      });
    } catch (error) {
      if (!error.response?.data) {
        throw error;
      }
      result = error.response.data;
    }

    if (result?.["verified"] === true || result?.["status"] === "success") {
      this.logger.success("Entry risk captcha verified.");
      return true;
    }

    this.logger.error(
      "Entry risk captcha rejected:",
      result?.["message"] || "Unknown error",
    );

    await this.utils.delayForSeconds(2, { signal: this.signal });

    return false;
  }

  /** @param {boolean} forceFresh - make the backend re-read the account */
  async completeLogin(forceFresh = false) {
    /* Attempts */
    let attempts = 0;

    this.logger.info("Completing login...");
    while (true) {
      if (this.signal.aborted) {
        throw new Error("Login aborted");
      }

      /** Answered outside the try, so having no way to answer fails the login instead of retrying it */
      let challenge = null;

      try {
        const data = await this.makeLoginAction(forceFresh);

        challenge = this.getEntryRiskChallenge(data);

        if (!challenge) {
          this.user_data = data;

          if (data?.["tma_session_token"]) {
            this.tmaSessionToken = data["tma_session_token"];
          }

          /** The app replaces its lease whenever the key is present, even when empty */
          if (data && "activity_lease_token" in data) {
            this.activityLeaseToken = String(
              data["activity_lease_token"] || "",
            );
          }

          this.applyActivityUi(data);
          break;
        }
      } catch (error) {
        challenge = this.getEntryRiskChallenge(error.response?.data);

        if (!challenge) {
          attempts++;
          if (attempts > MAX_LOGIN_ATTEMPTS) {
            throw new Error("Failed to sign in:", error);
          }
          const errorMessage = error.response?.data?.message || "Unknown error";
          const retryAfter = error.response?.data?.retry_after || 5;

          this.logger.error("Failed to sign in:", errorMessage);

          await this.utils.delayForSeconds(retryAfter, { signal: this.signal });
          continue;
        }
      }

      /** The drop withheld the account behind an image captcha */
      attempts++;
      if (attempts > MAX_LOGIN_ATTEMPTS) {
        throw new Error("Failed to sign in: entry risk captcha required");
      }

      this.logger.warn("Entry risk captcha required.");

      await this.solveEntryRiskCaptcha(challenge);
    }

    return this.user_data;
  }

  /** Login */
  async login(forceFresh = false) {
    /* Solve captcha and complete login */

    if (SHOULD_SOLVE_CAPTCHA_BEFORE_LOGIN) {
      await this.solveCaptcha();
    }

    await this.completeLogin(forceFresh);

    return this.user_data;
  }

  makeLoginAction(forceFresh = false) {
    /** The app sends the username and the inviter it was opened with */
    const refCode = this.getReferrerStartParam();

    return this.makeAction(
      "login",
      {
        username: this.getUsername(),
        ...(refCode ? { ref_code: refCode } : {}),
        ...(forceFresh ? { force_fresh: true, no_cache: true } : {}),
      },
      this.constructor.RISK_CHALLENGE_CONFIG,
    );
  }

  /** Get Auth Headers, with the session token login hands out once it has */
  getAuthHeaders() {
    const headers = {
      "x-requested-with": "XMLHttpRequest",
      "x-telegram-init-data": this.getInitData(),
    };

    if (this.tmaSessionToken) {
      headers["x-atf-tma-session"] = this.tmaSessionToken;
    }

    return headers;
  }

  makeAction(action, data = {}, config = {}) {
    return this.api
      .post(
        `https://atfminers.asloni.online/miner/index.php?action=${action}`,
        data,
        config,
      )
      .then((res) => res.data);
  }
}
