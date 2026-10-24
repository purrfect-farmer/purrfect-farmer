/**
 * A drop's Turnstile check: solve the widget once, however many callers ask
 * at the same time, then hand the token to the drop.
 */
export default class TurnstileGate {
  /**
   * @param {object} options
   * @param {string} options.siteKey - the drop's Turnstile site key
   * @param {string} options.pageUrl - the page the widget is rendered on
   * @param {string} [options.action] - the action the widget is rendered with
   * @param {() => boolean} options.canSolve - whether a captcha solver is configured
   * @param {(params: object) => Promise<string>} options.solveTurnstile - solves the widget
   * @param {(token: string) => Promise<any>} options.submit - hands the token to the drop, throwing on refusal
   * @param {() => object} options.logger - the logger at call time
   * @param {() => void} [options.onStart] - runs synchronously before anything else
   * @param {() => Promise<void>} [options.beforeSolve] - runs once a solver is known to exist
   */
  constructor({
    siteKey,
    pageUrl,
    action = null,
    canSolve,
    solveTurnstile,
    submit,
    logger,
    onStart = null,
    beforeSolve = null,
  }) {
    this.siteKey = siteKey;
    this.pageUrl = pageUrl;
    this.action = action;
    this.canSolve = canSolve;
    this.solveTurnstile = solveTurnstile;
    this.submit = submit;
    this.logger = logger;
    this.onStart = onStart;
    this.beforeSolve = beforeSolve;

    /** The attempt in flight, shared by concurrent callers */
    this.pending = null;
  }

  /** Pass the check, sharing one attempt between concurrent callers */
  obtain() {
    return (this.pending ||= this.run().finally(() => {
      this.pending = null;
    }));
  }

  /** Solve the widget and submit the token */
  async run() {
    this.onStart?.();

    if (!this.canSolve()) {
      throw new Error(
        "Captcha is required but no captcha provider is configured!",
      );
    }

    if (this.beforeSolve) {
      await this.beforeSolve();
    }

    this.logger().info("Solving the security check...");

    const params = { siteKey: this.siteKey, pageUrl: this.pageUrl };

    if (this.action) {
      params.action = this.action;
    }

    const token = await this.solveTurnstile(params);

    return this.submit(token);
  }
}
