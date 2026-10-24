import AdexiumClient from "../ads/AdexiumClient.js";
import AdsGramClient from "../ads/AdsGramClient.js";
import GigaPubClient from "../ads/GigaPubClient.js";
import MonetagClient from "../ads/MonetagClient.js";
import TadsClient from "../ads/TadsClient.js";

/** The ad networks a drop can show, by name */
const AD_CLIENTS = Object.freeze({
  adexium: AdexiumClient,
  adsgram: AdsGramClient,
  monetag: MonetagClient,
  gigapub: GigaPubClient,
  tads: TadsClient,
});

/** A drop's ad network clients, each created on first use and kept for the run */
export default class AdClients {
  /**
   * @param {() => object} getOptions - the farmer's ad client options, read on first use
   * @param {Record<string, object>} [settings] - extra options per network, e.g. `{ monetag: { zoneId } }`
   */
  constructor(getOptions, settings = {}) {
    this.getOptions = getOptions;
    this.settings = settings;
    this.clients = new Map();
  }

  /** The client for a network, created on first use */
  get(name) {
    if (!this.clients.has(name)) {
      const Client = AD_CLIENTS[name];

      this.clients.set(
        name,
        new Client({ ...this.getOptions(), ...this.settings[name] }),
      );
    }

    return this.clients.get(name);
  }

  get adexium() {
    return this.get("adexium");
  }

  get adsgram() {
    return this.get("adsgram");
  }

  get monetag() {
    return this.get("monetag");
  }

  get gigapub() {
    return this.get("gigapub");
  }

  get tads() {
    return this.get("tads");
  }
}
