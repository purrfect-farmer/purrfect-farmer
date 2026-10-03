import { createCaptchaProvider } from "./captcha/providers.js";

/** How long to wait before the first result poll */
const DEFAULT_INITIAL_DELAY = 20_000;

/** Image captchas come back in seconds, and the challenge can expire */
const IMAGE_INITIAL_DELAY = 5_000;

/** Providers expect raw base64, but an image may arrive as a data URI */
const normalizeBase64 = (body) =>
  typeof body === "string" ? body.replace(/^data:[^;,]*;base64,/, "") : body;

export default class CaptchaSolver {
  constructor(providerId, apiKey) {
    this.providerId = providerId;

    /** @type {import("./captcha/BaseCaptchaProvider.js").default} */
    this.provider = createCaptchaProvider(providerId, apiKey);
  }

  /** Check if configured */
  isConfigured() {
    return this.provider.isConfigured();
  }

  /** Get account balance, throwing when the key is rejected */
  getBalance() {
    return this.provider.getBalance();
  }

  /** Check if the provider offers a given method */
  supportsMethod(method) {
    return this.provider.supportsMethod(method);
  }

  /** Check if a method can be solved right now */
  canSolve(method) {
    return this.isConfigured() && this.supportsMethod(method);
  }

  /** Solve Captcha */
  solveCaptcha({
    method,
    siteKey,
    pageUrl,
    body,
    initialDelay = DEFAULT_INITIAL_DELAY,
  }) {
    console.log("Solving captcha...", { method, siteKey, pageUrl });
    return this.provider.solve({
      method,
      siteKey,
      pageUrl,
      body,
      initialDelay,
    });
  }

  /** Solve Turnstile */
  solveTurnstile({ siteKey, pageUrl }) {
    return this.solveCaptcha({ method: "turnstile", siteKey, pageUrl });
  }

  /** Solve ReCaptcha */
  solveReCaptcha({ siteKey, pageUrl }) {
    return this.solveCaptcha({ method: "recaptcha", siteKey, pageUrl });
  }

  /** Solve Image Captcha */
  solveImage({ body }) {
    return this.solveCaptcha({
      method: "base64",
      body: normalizeBase64(body),
      initialDelay: IMAGE_INITIAL_DELAY,
    });
  }
}
