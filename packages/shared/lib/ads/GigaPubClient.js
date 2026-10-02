import AdexiumClient from "./AdexiumClient.js";
import GigaBidClient from "./GigaBidClient.js";
import MonetagClient from "./MonetagClient.js";
import RichAdsClient from "./RichAdsClient.js";

/** GigaPub's own host, which serves the per-project script and the stats API */
const GIGAPUB_HOST = "ad.gigapub.tech";

/** The SDK build the project scripts ship, sent as `version` */
const SDK_VERSION = "v87";

/** Shows at or under this many seconds are reported by the SDK as too fast */
const MIN_SHOW_SECONDS = 2.9;

/** Where GigaPub's Monetag build is loaded from, and the ad host baked into it */
const MONETAG_SDK_HOST = "munqu.com";
const MONETAG_HOST = "d3rem.com";

/** Placement every project script ships */
const DEFAULT_PLACEMENT = "main";

/** How the SDK names each network, mapped to how a client plays it */
const NETWORK_KINDS = {
  monetag: "monetag",
  m: "monetag",
  m1: "monetag",
  m2: "monetag",
  m3: "monetag",
  rich: "richNative",
  r: "richNative",
  rD: "richNative",
  rB: "richInterstitial",
  rR: "richInterstitial",
  t: "adexium",
  b: "bid",
};

/** Mediates a GigaPub project the way `window.showGiga()` would. See `GigaPubClient.README.md` */
export default class GigaPubClient {
  /**
   * @param {object} farmer - the farmer instance, for its api/initData/signal
   * @param {object} options
   * @param {string|number} options.projectId - the `id` in the page's `ad.gigapub.tech/script?id=` tag
   * @param {string} [options.token] - the project's bearer token, read from its script when left out
   * @param {object[]} [options.networks] - the script's `ads` list, `{ name, data }` per network; Monetag alone when left out
   * @param {object} [options.rotation] - the placement's `{ type, order, chances }`
   * @param {string} [options.placementId] - the placement to report
   * @param {boolean} [options.doubleShow] - follow a success with a second network, as the SDK's X config does
   * @param {string} [options.tgPlatform] - Telegram client platform
   * @param {string} [options.tgVersion] - Telegram WebApp version
   */
  constructor(farmer, options = {}) {
    this.farmer = farmer;

    this.projectId = String(options.projectId ?? "");
    this.token = options.token;
    this.networks = options.networks;
    this.rotation = options.rotation;
    this.placementId = options.placementId || DEFAULT_PLACEMENT;
    this.doubleShow = Boolean(options.doubleShow);
    this.tgPlatform = options.tgPlatform || "android";
    this.tgVersion = options.tgVersion || "8.0";

    /** One client per network, created on first use */
    this.clients = new Map();

    /** When the "page" loaded, which `init` reports seconds against */
    this.loadedAt = Date.now();
    this.showCounter = 0;
  }

  /** The farmer's abort signal, read late so each run gets its own */
  get signal() {
    return this.farmer.signal;
  }

  /** Show one rewarded ad, as `showGiga()` would, falling through networks in rotation order
   * @param {object} [options]
   * @param {string} [options.transactionId] - what the page passed to `showGiga`, used as Monetag's `ymid`
   * @param {string} [options.showTag] - what the page passed as `showTag`, reported with the show
   * @returns {Promise<object>} the network that played and how long it took
   */
  async watch({ transactionId = null, showTag = null } = {}) {
    await this.init();

    const rotationType = this.rotation?.["type"] || "chanceOrder";
    const priorityList = this.getPriorityList();
    const order = this.injectBidNet([...priorityList]).filter((name) =>
      this.isPlayable(name),
    );

    const uniqShowId = this.createShowId();
    let shown = null;
    let showCounter = 0;
    let showTryCounter = 0;

    for (const network of order) {
      if (this.signal?.aborted) break;

      const anyData = {
        fallPriorityList: priorityList,
        fallRotationType: rotationType,
        showCounter,
        showTryCounter,
        uniqShowId,
        readyNetsCount: order.length,
        showTag,
      };
      const reportedRotation = network === "b" ? "bid" : rotationType;
      const report = {
        placementId: this.placementId,
        network,
        rotationType: reportedRotation,
        transactionId: showCounter === 0 ? transactionId : null,
        version: SDK_VERSION,
      };

      await this.report("adShowTryStart", {
        ...report,
        showCounter: this.showCounter,
        anyData,
      });

      showTryCounter++;

      const startedAt = Date.now();

      try {
        await this.play(network, report.transactionId);

        const seconds = (Date.now() - startedAt) / 1000;

        if (seconds <= MIN_SHOW_SECONDS) {
          throw new TooFastError("Show time is 0 seconds");
        }

        this.showCounter++;

        await this.report(showCounter === 0 ? "adShowed" : "adShowedX", {
          ...report,
          showCounter: this.showCounter,
          seconds,
          anyData: {
            ...anyData,
            showTryCounter,
            showDone: !this.doubleShow ? showCounter === 0 : showCounter > 0,
          },
        });

        shown ||= { network, seconds };
        showCounter++;

        if (this.doubleShow && showCounter < 2) continue;

        return shown;
      } catch (error) {
        this.farmer.debugger?.log(`GigaPub ${network} failed:`, error.message);

        await this.report("adShowError", {
          ...report,
          showCounter: this.showCounter,
          error: error instanceof TooFastError ? "TooFastWatchingError" : null,
          anyData: { ...anyData, showTryCounter },
        });
      }
    }

    if (shown) return shown;

    throw new Error("GigaPub failed to show an ad");
  }

  /* --------------------------------------------------------------------- */
  /* Networks                                                              */
  /* --------------------------------------------------------------------- */

  /** Play one network's ad to the end */
  async play(name, transactionId) {
    const kind = NETWORK_KINDS[name];
    const client = this.getClient(name);

    switch (kind) {
      case "monetag":
        return client.play(this.getNetworkData(name)["zone"], {
          ymid: transactionId || undefined,
        });

      case "richNative":
        return client.native();

      case "richInterstitial":
        return client.interstitial();

      case "adexium":
        return client.play();

      case "bid":
        return client.watch();
    }
  }

  /** A network's client, created once with the data the script holds for it */
  getClient(name) {
    if (this.clients.has(name)) return this.clients.get(name);

    const data = this.getNetworkData(name);
    const common = { tgPlatform: this.tgPlatform, tgVersion: this.tgVersion };
    let client;

    switch (NETWORK_KINDS[name]) {
      case "monetag":
        client = new MonetagClient(this.farmer, {
          ...common,
          host: MONETAG_HOST,
          sdkHost: MONETAG_SDK_HOST,
        });
        break;

      case "richNative":
      case "richInterstitial":
        client = new RichAdsClient(this.farmer, {
          ...common,
          pubId: data["pubId"],
          appId: data["appId"],
        });
        break;

      case "adexium":
        client = new AdexiumClient(this.farmer, {
          ...common,
          wid: data["wId"],
        });
        break;

      case "bid":
        client = new GigaBidClient(this.farmer, {
          ...common,
          projectId: data["id"],
          placementId: data["placeId"],
          mode: data["m"],
        });
        break;
    }

    this.clients.set(name, client);

    return client;
  }

  /** The script's data for a network's placement */
  getNetworkData(name) {
    const network = this.networks.find((item) => item["name"] === name);
    const placements = network?.["placements"] || [];

    return (
      placements.find((item) => item["id"] === this.placementId)?.["data"] ||
      placements[0]?.["data"] ||
      network?.["data"] ||
      {}
    );
  }

  /** Whether a network is configured and has a headless client */
  isPlayable(name) {
    return (
      Boolean(NETWORK_KINDS[name]) &&
      this.networks.some((item) => item["name"] === name)
    );
  }

  /** The placement's networks in show order, as its rotation type picks them */
  getPriorityList() {
    const order = this.rotation?.["order"] || this.networks.map((n) => n.name);

    if (this.rotation?.["type"] !== "chanceOrder") return [...order];

    /** Weighted draw without replacement, the drawn weight moving to the heaviest remaining */
    const weights = { ...this.rotation["chances"] };
    let names = Object.keys(weights).filter((name) => weights[name] > 0);
    const list = [];

    while (names.length) {
      const total = names.reduce((sum, name) => sum + weights[name], 0);
      let roll = Math.random() * total;
      let picked = names[names.length - 1];

      for (const name of names) {
        if (roll < weights[name]) {
          picked = name;
          break;
        }
        roll -= weights[name];
      }

      list.push(picked);
      names = names.filter((name) => name !== picked);

      if (names.length > 1) {
        const heaviest = names.reduce((a, b) => (weights[b] > weights[a] ? b : a));
        weights[heaviest] += weights[picked];
      }
    }

    return list;
  }

  /** Bid-net goes first, behind RichAds only when RichAds drew first */
  injectBidNet(order) {
    if (!this.networks.some((item) => item["name"] === "b")) return order;

    const rest = order.filter((name) => name !== "b");
    const lead = ["r", "rich"].includes(rest[0]) ? [rest.shift()] : [];

    return [...lead, "b", ...rest];
  }

  /* --------------------------------------------------------------------- */
  /* Project                                                               */
  /* --------------------------------------------------------------------- */

  /** Read the project's script once and announce the session, as the SDK does on load */
  async init() {
    if (this.initialized) return;

    await this.loadProject();

    await this.report("init", {
      version: SDK_VERSION,
      seconds: (Date.now() - this.loadedAt) / 1000,
    });

    this.initialized = true;
  }

  /** Fill in the token, and Monetag alone when no networks were given, from the project's own script */
  async loadProject() {
    if (this.token && this.networks) return;

    if (!this.projectId) {
      throw new Error("GigaPub needs a project id");
    }

    const script = await this.farmer.api
      .get(`https://${GIGAPUB_HOST}/script`, {
        params: { id: this.projectId },
        responseType: "text",
        signal: this.signal,
        headers: { Authorization: null },
      })
      .then((response) => String(response.data || ""));

    /** The token sits in the string table as the only 32-character alphanumeric literal */
    this.token ||= script.match(/'([A-Za-z0-9]{32})'/)?.[1];

    if (!this.networks) {
      const zone = script.match(/show_(\d+)/)?.[1];

      this.networks = zone ? [{ name: "monetag", data: { zone } }] : [];
    }

    if (!this.token || !this.networks.length) {
      throw new Error("Could not read the GigaPub project script");
    }

    this.farmer.debugger?.log("GigaPub project:", {
      projectId: this.projectId,
      networks: this.networks.map((item) => item["name"]),
    });
  }

  /* --------------------------------------------------------------------- */
  /* Stats                                                                 */
  /* --------------------------------------------------------------------- */

  /** Post an event to GigaPub's stats API, best-effort as the SDK treats it */
  async report(method, args) {
    try {
      const response = await this.farmer.api.post(
        `https://${GIGAPUB_HOST}/v1/ad`,
        { method, args: { user: this.getUserData(), ...args } },
        {
          signal: this.signal,
          headers: {
            "project-id": this.projectId,
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.farmer.debugger?.log(`GigaPub ${method} failed:`, error.message);
      return null;
    }
  }

  /** The launch data the SDK lifts from `Telegram.WebApp` */
  getUserData() {
    return {
      user: this.farmer.getTelegramUser(),
      platform: this.tgPlatform,
      version: this.tgVersion,
      start_param: this.farmer.getStartParam() || null,
    };
  }

  /** A show id in the SDK's shape: ms into the week, a dot, then a random six-digit tail */
  createShowId() {
    return `${Date.now() % (7 * 864e5)}.${Math.floor(Math.random() * 1e6)}`;
  }
}

/** A show that ended too fast to count, reported as the SDK's `TooFastWatchingError` */
class TooFastError extends Error {}
