import FarmerModule from "../../lib/farmer/FarmerModule.js";
import TurnstileGate from "../../lib/farmer/TurnstileGate.js";
import {
  HUMAN_CHECK_EXPIRY_MARGIN_SECONDS,
  TURNSTILE_PAGE_URL,
  TURNSTILE_SITE_KEY,
} from "./constants.js";

/** The Turnstile human check and how long it is trusted */
export default class MRGHumanCheck extends FarmerModule {
  /** When the stored check runs out */
  verifiedUntil = null;

  /** Whether the stored check has been read */
  restored = false;

  /** The single-flight Turnstile solve */
  gate = new TurnstileGate({
    siteKey: TURNSTILE_SITE_KEY,
    pageUrl: TURNSTILE_PAGE_URL,
    canSolve: () => this.core.captcha.canSolveTurnstile(),
    solveTurnstile: (params) => this.core.captcha.solveTurnstile(params),
    submit: (token) => this.submit(token),
    logger: () => this.logger,
  });

  /** Read the stored check once, keeping it only while it belongs to this user */
  async restore() {
    if (this.restored) return;

    this.restored = true;

    const stored = await this.storage?.get("humanCheck");

    if (stored?.["userId"] === String(this.core.userId())) {
      this.verifiedUntil = stored["until"] || null;
    }
  }

  /** When the check runs out, as the later of the stored and the server's reading */
  getUntil() {
    const times = [
      this.verifiedUntil,
      this.ctx.state.data?.user?.["humanVerifiedUntil"],
    ]
      .map((value) => (value ? new Date(value).getTime() : 0))
      .filter((time) => Number.isFinite(time) && time > 0);

    return times.length ? Math.max(...times) : 0;
  }

  /** Whether the check outlives the safety margin */
  isValid() {
    return (
      this.getUntil() - Date.now() > HUMAN_CHECK_EXPIRY_MARGIN_SECONDS * 1000
    );
  }

  /** Keep the check's expiry in memory and in storage, so the next run skips the captcha */
  async store(until) {
    this.verifiedUntil = until || null;

    if (this.ctx.state.data?.user) {
      this.ctx.state.data.user["humanVerifiedUntil"] = this.verifiedUntil;
    }

    try {
      await this.storage?.set(
        "humanCheck",
        this.verifiedUntil
          ? { userId: String(this.core.userId()), until: this.verifiedUntil }
          : null,
      );
    } catch (error) {
      this.logger.warn("Failed to store the human check:", error.message);
    }
  }

  /** Pass the human check, sharing one attempt between concurrent callers */
  obtain() {
    return this.gate.obtain();
  }

  /** Hand a solved Turnstile token over and store how long the backend now trusts the account */
  async submit(turnstileToken) {
    const result = await this.ctx.api.verifyHuman(turnstileToken);

    if (!result?.["success"] || !result["humanVerifiedUntil"]) {
      throw new Error(result?.["error"] || "The human check was refused");
    }

    await this.store(result["humanVerifiedUntil"]);

    this.logger.success(
      `Human check valid until ${new Date(result["humanVerifiedUntil"]).toLocaleString()}.`,
    );

    return result;
  }

  /** Pass the human check only when the stored one has run out */
  async ensure() {
    await this.restore();

    if (this.isValid()) {
      this.logger.info(
        `Human check valid until ${new Date(this.getUntil()).toLocaleString()}.`,
      );
      return;
    }

    await this.obtain();
  }

  /** Pass the human check on demand, whatever the stored one says */
  async renew() {
    await this.ctx.state.ensureLoaded();
    await this.obtain();
  }

  /** Forget the stored check, so the next run solves the captcha again */
  async reset() {
    await this.store(null);
    this.logger.success("Human check cleared.");
  }
}
