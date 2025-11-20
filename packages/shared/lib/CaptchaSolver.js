import axios from "axios";

export default class CaptchaSolver {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  /** Check if configured */
  isConfigured() {
    return Boolean(this.apiKey);
  }

  /** Get Turnstile Request */
  getTurnstileRequest({ siteKey, pageUrl }) {
    return axios
      .post("https://2captcha.com/in.php", {
        key: this.apiKey,
        method: "turnstile",
        sitekey: siteKey,
        pageurl: pageUrl,
        json: 1,
      })
      .then((res) => res.data);
  }

  /** Get Turnstile Result */
  getTurnstileResult(requestId) {
    return axios
      .get("https://2captcha.com/res.php", {
        params: {
          key: this.apiKey,
          action: "get",
          id: requestId,
          json: 1,
        },
      })
      .then((res) => res.data);
  }

  /** Solve Turnstile */
  async solveTurnstile({ siteKey, pageUrl }) {
    const response = await this.getTurnstileRequest({ siteKey, pageUrl });
    const requestId = response.request;

    /* Wait for 20 seconds before polling for the result */
    await new Promise((resolve) => setTimeout(resolve, 20_000));

    while (true) {
      const result = await this.getTurnstileResult(requestId);
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
}
