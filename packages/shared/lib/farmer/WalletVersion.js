/** The wallet version an Auto connected with, kept in storage since the drops never report one */
export default class WalletVersion {
  /** @param {() => { get: Function, set: Function } | undefined} storage - the farmer's storage at call time */
  constructor(storage) {
    this.storage = storage;

    /** The stored version, as `v4` or `v5` */
    this.current = undefined;
  }

  /** Read the stored version */
  async load() {
    this.current = await this.storage()?.get("walletVersion");
  }

  /** Keep the version a wallet was loaded with, or forget it when `version` is empty */
  async remember(version) {
    this.current = version ? `v${version}` : undefined;

    await this.storage()?.set("walletVersion", this.current);
  }
}
