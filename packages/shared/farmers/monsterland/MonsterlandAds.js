import AdsGramClient from "../../lib/ads/AdsGramClient.js";
import MonetagClient from "../../lib/ads/MonetagClient.js";
import {
  ADSGRAM_BLOCK_ID,
  AD_RESULT_POLL_SECONDS,
  AD_RESULT_TIMEOUT_SECONDS,
  GIGAPUB_PROJECT_ID,
  MONETAG_COMPLETE_ATTEMPTS,
  MONETAG_COMPLETE_INTERVAL_SECONDS,
  MONETAG_ZONE_ID,
  PLAYABLE_AD_PROVIDERS,
  TADS_WIDGET_ID,
} from "./constants.js";
import GigaPubClient from "../../lib/ads/GigaPubClient.js";
import TadsClient from "../../lib/ads/TadsClient.js";
import MonsterlandState from "./MonsterlandState.js";

/** Watching rewarded ads across the page's providers */
export default class MonsterlandAds extends MonsterlandState {
  /* --------------------------------------------------------------------- */
  /* Ads                                                                   */
  /* --------------------------------------------------------------------- */

  /** The page's AdsGram block, created once per run */
  get adsgram() {
    return (this._adsgram ||= new AdsGramClient(this.getAdClientOptions()));
  }

  /** The page's Monetag zone, created once per run */
  get monetag() {
    return (this._monetag ||= new MonetagClient({
      ...this.getAdClientOptions(),
      zoneId: MONETAG_ZONE_ID,
    }));
  }

  /** The page's GigaPub project, created once per run */
  get gigapub() {
    return (this._gigapub ||= new GigaPubClient({
      ...this.getAdClientOptions(),
      projectId: GIGAPUB_PROJECT_ID,
    }));
  }

  /** The page's TADS widget, created once per run */
  get tads() {
    return (this._tads ||= new TadsClient({
      ...this.getAdClientOptions(),
      widgetId: TADS_WIDGET_ID,
    }));
  }

  /** Watch an ad for an action, falling back across providers the way the page does
   * @returns {Promise<object|null>} the backend's settlement, or `null` when no ad paid
   */
  async watchAdFor(action, metadata) {
    const failedProviders = [];
    let lastTxId = null;
    let lastProvider = null;
    let nonValued = false;

    for (let attempt = 0; attempt < 6 && !this.signal.aborted; attempt++) {
      const fallback = lastTxId
        ? {
            fallback: true,
            fallbackOfTxId: lastTxId,
            lastFailedProvider: lastProvider,
            failedProviders,
            ...(nonValued && { nonValued: true }),
          }
        : undefined;

      const task = await this.createAdTask(action, metadata, fallback);

      if (!task.ok) {
        const reason = task.data["reason"];

        if (
          (reason === "CONSECUTIVE_COOLDOWN" || reason === "BURST_COOLDOWN") &&
          task.data["waitSeconds"]
        ) {
          await this.utils.delayForSeconds(Number(task.data["waitSeconds"]), {
            signal: this.signal,
          });
          continue;
        }

        this.logger.warn("No ad available:", task.data["error"] || reason);
        this.adsUnavailable = true;
        return null;
      }

      const { adTxId, provider } = task.data;

      lastTxId = adTxId;
      lastProvider = provider;

      if (!PLAYABLE_AD_PROVIDERS.includes(provider)) {
        this.logger.info(`Skipping ${provider} ad.`);
        if (!failedProviders.includes(provider)) failedProviders.push(provider);
        await this.abandonAd(adTxId);
        continue;
      }

      try {
        const result = await this.playAd(provider, adTxId, task.data);

        if (result) return result;

        throw new Error("The ad was not settled");
      } catch (error) {
        this.logger.warn(`${provider} ad failed:`, error.message);
        if (!failedProviders.includes(provider)) failedProviders.push(provider);

        /** Once Monetag comes back non-valued, the page flags the abandon and every fallback after it */
        nonValued ||= Boolean(error.nonValued);
        await this.abandonAd(adTxId, error.nonValued);
      }
    }

    this.adsUnavailable = true;
    return null;
  }

  /** Play one ad through its provider and wait for the backend to settle it */
  async playAd(provider, adTxId, task) {
    this.logger.info(`Watching a ${provider} ad...`);

    switch (provider) {
      case "adsgram":
        await this.adsgram.watch(ADSGRAM_BLOCK_ID);
        return this.waitForAdResult(adTxId);

      case "monetag": {
        const format = task["monetagFormat"] || "interstitial";
        const ymid = `${this.getUserId()}_${adTxId}`;
        const { event } =
          format === "pop"
            ? await this.monetag.pop(MONETAG_ZONE_ID, { ymid })
            : await this.monetag.play(MONETAG_ZONE_ID, { ymid });

        this.assertMonetagValued(event);

        return this.completeMonetagAd(adTxId, event, task);
      }

      case "tads":
        await this.tads.watch();
        return this.waitForAdResult(adTxId);

      case "gigapub": {
        await this.gigapub.watch();

        const result = await this.completeAd(adTxId, "gigapub");

        if (!result.ok) {
          throw new Error(result.data["error"] || "GigaPub was not verified");
        }

        return result.data;
      }
    }
  }

  /** Poll for an ad the provider settles with the backend directly */
  async waitForAdResult(adTxId) {
    const attempts = Math.ceil(
      AD_RESULT_TIMEOUT_SECONDS / AD_RESULT_POLL_SECONDS,
    );

    for (
      let attempt = 0;
      attempt < attempts && !this.signal.aborted;
      attempt++
    ) {
      const result = await this.fetchAdTaskResult(adTxId);

      if (result) {
        if (result["success"] === false) {
          throw new Error(result["error"] || "The ad was not paid");
        }

        return result;
      }

      await this.utils.delayForSeconds(AD_RESULT_POLL_SECONDS, {
        signal: this.signal,
      });
    }

    throw new Error("Timed out waiting for the ad to settle");
  }

  /** The page only confirms a Monetag ad that resolved as `valued` */
  assertMonetagValued(event) {
    const read = (value) => {
      const type = typeof value === "string" ? value.trim().toLowerCase() : "";
      return type === "valued" || type === "non_valued" ? type : undefined;
    };

    let type;

    if (typeof event === "string" && event.includes("=")) {
      const params = new URLSearchParams(event.replace(/^\?/, ""));
      type = read(params.get("reward_event_type")) || read(params.get("value"));
    } else if (typeof event === "string") {
      type = read(event);
    } else if (event && typeof event === "object") {
      type = read(event["reward_event_type"]) || read(event["value"]);
    }

    if (type === "valued") return;

    const error = new Error(
      type === "non_valued"
        ? "Monetag ad was non_valued"
        : "Monetag did not confirm a valued reward",
    );

    error.nonValued = type === "non_valued";

    throw error;
  }

  /** Confirm a Monetag ad, waiting out the postback the way the page does */
  async completeMonetagAd(adTxId, event) {
    const estimatedPrice = Number.parseFloat(
      event?.["estimated_price"] ?? event?.["estimatedPrice"],
    );

    for (let attempt = 0; attempt < MONETAG_COMPLETE_ATTEMPTS; attempt++) {
      const result = await this.completeAd(adTxId, "monetag", {
        monetagEstimatedPrice: Number.isFinite(estimatedPrice)
          ? estimatedPrice
          : null,
      });

      if (result.ok) return result.data;

      if (result.data["reason"] !== "WEBHOOK_PENDING") {
        throw new Error(result.data["error"] || result.data["reason"]);
      }

      await this.utils.delayForSeconds(MONETAG_COMPLETE_INTERVAL_SECONDS, {
        signal: this.signal,
      });
    }

    throw new Error("Monetag postback timed out");
  }

  /** Watch an action's whole ad sequence, waiting between ads as the backend asks
   * @returns {Promise<object|null>} the final settlement, or `null` when the sequence broke off
   */
  async watchAdSequence(action, metadata) {
    for (let index = 0; index < 10 && !this.signal.aborted; index++) {
      const result = await this.watchAdFor(action, metadata);

      if (!result) return null;

      if (!result["intermediate"]) return result;

      await this.utils.delayForSeconds(Number(result["nextWaitSeconds"]) || 0, {
        signal: this.signal,
      });
    }

    return null;
  }
}
