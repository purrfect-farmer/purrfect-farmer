import axios from "axios";

const PROVIDER_METHODS = {
  "2captcha": {
    recaptcha: "userrecaptcha",
    turnstile: "turnstile",
  },
  captchaai: {
    turnstile: "turnstile",
  },
  solvecaptcha: {
    turnstile: "turnstile",
  },
  captchasonic: {
    turnstile: "AntiTurnstileTaskProxyLess",
  },
  nocaptchaai: {
    turnstile: "AntiTurnstileTask",
  },
};

export default class CaptchaSolver {
  constructor(provider, apiKey) {
    this.provider = provider;
    this.apiKey = apiKey;

    let baseURL = "";
    let taskBased = false;
    let taskType = "";
    let authProperty = "";

    switch (this.provider) {
      case "2captcha":
        baseURL = "https://2captcha.com";
        break;

      case "captchaai":
        baseURL = "https://ocr.captchaai.com";
        break;

      case "solvecaptcha":
        baseURL = "https://api.solvecaptcha.com";
        break;

      case "captchasonic":
        taskBased = true;
        authProperty = "apiKey";
        taskType = "AntiTurnstileTaskProxyLess";
        baseURL = "https://api.captchasonic.com";
        break;

      case "nocaptchaai":
        taskBased = true;
        authProperty = "clientKey";
        taskType = "AntiTurnstileTask";
        baseURL = "https://api.nocaptchaai.com";
        break;

      default:
        throw new Error(`Unsupported captcha provider: ${this.provider}`);
    }

    this.taskBased = taskBased;
    this.authProperty = authProperty;
    this.taskType = taskType;
    this.api = axios.create({
      baseURL: baseURL,
      timeout: 120_000,
    });
  }

  /** Check if configured */
  isConfigured() {
    return Boolean(this.provider && this.apiKey);
  }

  async createRequest({ method, siteKey, pageUrl }) {
    const providerMethod = PROVIDER_METHODS[this.provider][method];

    if (this.taskBased) {
      return this.api
        .post("/createTask", {
          [this.authProperty]: this.apiKey,
          task: {
            type: providerMethod,
            websiteURL: pageUrl,
            websiteKey: siteKey,
          },
        })
        .then((res) => ({
          ...res.data,
          request: res.data.taskId,
        }));
    } else {
      return this.api
        .post("/in.php", {
          key: this.apiKey,
          method: providerMethod,
          sitekey: siteKey,
          googlekey: siteKey,
          pageurl: pageUrl,
          json: 1,
        })
        .then((res) => res.data);
    }
  }

  /** Get Turnstile Request */
  getTurnstileRequest({ siteKey, pageUrl }) {
    return this.createRequest({ method: "turnstile", siteKey, pageUrl });
  }

  /** Get ReCaptcha Request */
  getReCaptchaRequest({ siteKey, pageUrl }) {
    return this.createRequest({ method: "recaptcha", siteKey, pageUrl });
  }

  /** Get Captcha Result */
  getCaptchaResult(requestId) {
    if (this.taskBased) {
      return this.api
        .post("/getTaskResult", {
          [this.authProperty]: this.apiKey,
          taskId: requestId,
        })
        .then((res) => {
          return {
            status: res.data.errorId === 0 ? 1 : 0,
            request: res.data.solution ? res.data.solution.token : null,
          };
        });
    } else {
      return this.api
        .get("/res.php", {
          params: {
            key: this.apiKey,
            action: "get",
            id: requestId,
            json: 1,
          },
        })
        .then((res) => res.data);
    }
  }

  /** Solve Captcha */
  async solveCaptcha({ method, siteKey, pageUrl }) {
    console.log("Solving captcha...", method, siteKey, pageUrl);
    const response = await this.createRequest({ method, siteKey, pageUrl });
    const requestId = response.request;

    /* Wait for 20 seconds before polling for the result */
    await new Promise((resolve) => setTimeout(resolve, 20_000));

    while (true) {
      const result = await this.getCaptchaResult(requestId);
      if (result.status === 1) {
        return result.request; /* Captcha solved */
      } else if (result.request === "CAPCHA_NOT_READY") {
        /* Wait for 5 seconds before polling again */
        await new Promise((resolve) => setTimeout(resolve, 5_000));
      } else {
        throw new Error(`Captcha solving failed: ${result.request}`);
      }
    }
  }

  /** Solve Turnstile */
  async solveTurnstile({ siteKey, pageUrl }) {
    return this.solveCaptcha({ method: "turnstile", siteKey, pageUrl });
  }

  /** Solve ReCaptcha */
  async solveReCaptcha({ siteKey, pageUrl }) {
    return this.solveCaptcha({ method: "recaptcha", siteKey, pageUrl });
  }
}
