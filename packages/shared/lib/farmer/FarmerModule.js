/** One concern of a drop, reaching host services through `core` and its sibling modules through `ctx` */
export default class FarmerModule {
  /**
   * @param {object} deps
   * @param {ReturnType<import("./createFarmerCore.js").default>} deps.core
   * @param {object} deps.ctx - the drop's modules, filled in before any of them runs
   */
  constructor({ core, ctx }) {
    this.core = core;
    this.ctx = ctx;
  }

  /** @type {import("axios").AxiosInstance} */
  get api() {
    return this.core.api;
  }

  /** @type {import("../BaseLogger.js").default} */
  get logger() {
    return this.core.logger;
  }

  get utils() {
    return this.core.utils;
  }

  get storage() {
    return this.core.storage;
  }

  get signal() {
    return this.core.signal;
  }
}
