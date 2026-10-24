import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  RECORD_DAILY_INTERACTION,
  RECORD_NAVIGATION_BATCH,
} from "./constants.js";

/** The presence and activity the page reports */
export default class ATFActivity extends FarmerModule {
  /** When the page came to the foreground this run */
  fgEpoch = null;

  /** Record Daily Interaction */
  async recordDailyInteraction() {
    if (!RECORD_DAILY_INTERACTION) {
      return;
    }

    /** The app reports once per UTC day, until the server calls it qualified */
    const day = new Date().toISOString().slice(0, 10);

    if ((await this.storage?.get("interactionDay")) === day) {
      return;
    }

    /** The app only reports once foreground >= 15, scroll >= 300, menus >= 2 and a menu change */
    const result = await this.ctx.api.makeAction("record_daily_interaction", {
      foreground_seconds: 15 + Math.floor(Math.random() * 60),
      scroll_pixels: 300 + Math.floor(Math.random() * 900),
      unique_menus: 2 + Math.floor(Math.random() * 3),
      menu_changes: 1 + Math.floor(Math.random() * 6),
      trusted_input: 1,
    });

    if (result?.["status"] === "success" && result?.["qualified"] === true) {
      await this.storage?.set("interactionDay", day);
    }

    await this.utils.delay(300, { signal: this.signal });
  }

  /** Keep the activity snapshot the server sends with login, sync_wallet and sync_mining_state */
  applyActivityUi(data) {
    const snapshot = data?.["activity_ui"] ?? data?.["user"]?.["activity_ui"];

    if (snapshot && typeof snapshot === "object" && this.ctx.state.data?.user) {
      this.ctx.state.data.user["activity_ui"] = snapshot;
    }
  }

  /** The app syncs its verified wallet on open, which carries the foreground presence */
  async syncPresence() {
    const { user } = this.ctx.state.data;

    /** Without a verified wallet the app waits for a TON proof instead */
    if (!user["wallet_address"] || Number(user["wallet_verified"]) !== 1) {
      return;
    }

    const result = await this.ctx.api.resyncWallet();

    if (result?.["user"]) {
      Object.assign(user, result["user"]);
    }

    this.applyActivityUi(result);
    await this.sendForegroundSeen();
  }

  /** The app beacons a positive presence when Telegram reactivates it */
  async sendForegroundSeen() {
    if (!this.ctx.session.tmaSessionToken) {
      return;
    }

    try {
      await this.ctx.api.makeAction("foreground_transition_shadow", {
        fg_event: "seen",
        fg_epoch: this.getForegroundEpoch(),
        activity_lease: this.ctx.session.activityLeaseToken || "",
      });
    } catch {
      /** Telemetry, the app never lets it fail anything */
    }
  }

  /** The app beacons the end of each foreground epoch when it is hidden or closed */
  async sendForegroundHidden() {
    if (!this.ctx.session.tmaSessionToken) {
      return;
    }

    try {
      await this.ctx.api.makeAction("foreground_transition_shadow", {
        fg_event: "hidden",
        fg_epoch: this.getForegroundEpoch(),
        activity_lease: this.ctx.session.activityLeaseToken || "",
      });
    } catch {
      /** Telemetry, the app never lets it fail anything */
    }
  }

  /** Record Navigation Batch */
  async recordNavigationBatch(delta = 1) {
    if (!RECORD_NAVIGATION_BATCH) {
      return;
    }

    await this.ctx.api.makeAction("record_navigation_batch", {
      delta: delta,
      batch_id: `nav_${this.utils.uuid()}`,
    });
    await this.utils.delay(300, { signal: this.signal });
  }

  /** The app starts a new foreground epoch each time it becomes visible, once per run here */
  getForegroundEpoch() {
    if (!this.fgEpoch) {
      this.fgEpoch = Date.now();
    }

    return this.fgEpoch;
  }
}
