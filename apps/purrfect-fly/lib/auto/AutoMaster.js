import AutoBooster from "../AutoBooster.js";
import AutoWalletTransfer from "../AutoWalletTransfer.js";
import logger from "../logger.js";
import { prepareMaster } from "@purrfect/shared/lib/auto/transactions.js";

/** The wallet a run sends from, which rolls forward through the accounts it boosts */
class AutoMaster {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;

    /** The wallet currently holding the funds, with its decrypted phrase */
    this.masterData = null;

    /** Its prepared balances */
    this.prepared = null;

    /** Boost mode: roll or collect */
    this.mode = "roll";
  }

  /** Prepare initial master data */
  async prepareInitial() {
    const { master } = this.ctx;

    logger.info("Decrypting master wallet....");
    const phrase = await this.ctx.decryptPhrase(master.encryptedWalletPhrase);

    logger.success("Successfully decrypted master wallet!");

    this.masterData = {
      tonCenterApiKey: master.tonCenterApiKey,
      address: master.address,
      version: master.version,
      phrase,
    };

    logger.info("Preparing master wallet...");
    this.prepared = await prepareMaster(this.masterData, this.ctx.jettonAddress);
    logger.success("Successfully prepared the master wallet!");
  }

  /** Re-read the wallet currently holding the funds, which a retained run carries into the next pass */
  async prepareCurrent() {
    logger.info(
      "Preparing current holder as master wallet:",
      this.masterData.address,
    );
    this.prepared = await prepareMaster(this.masterData, this.ctx.jettonAddress);
    logger.success(
      "Successfully prepared the current holder as the master wallet!",
    );
  }

  /** Whether the master has nothing to boost with */
  isEmpty() {
    return this.prepared.jettonBalance.lessThanOrEqualTo(0);
  }

  /** A booster sending from the current master to one account */
  createBooster(walletAccount) {
    return new AutoBooster(this.masterData, walletAccount, this.prepared);
  }

  /** Roll onto the account or collect from it, depending on the mode */
  async applyMode(account, phrase, booster) {
    if (this.mode === "roll") {
      await this.rollTo(account, phrase);
    } else {
      await this.collectFrom(account, booster);
    }
  }

  /** Collect from account */
  async collectFrom(account, booster) {
    const asset = this.ctx.native ? "TON" : `${this.ctx.token} and TON`;

    logger.info(`Collecting ${asset}:`, account.address);
    await booster.collect();
    logger.success(`Successfully collected ${asset}:`, account.address);
  }

  /** Transfer everything into this account, which then becomes the master */
  async rollTo(account, phrase) {
    logger.info("Transferring funds into:", account.address);
    const walletTransfer = new AutoWalletTransfer(
      this.masterData,
      account.address,
      this.ctx.jettonAddress,
    );
    await walletTransfer.transfer();
    logger.success("Successfully transferred funds into:", account.address);

    this.masterData = {
      ...this.masterData,
      address: account.address,
      version: account.version,
      phrase,
    };

    /** Delay for 2s */
    await this.ctx.delaySeconds(2);

    logger.info(`Preparing (${account.address}) as master wallet...`);
    this.prepared = await prepareMaster(this.masterData, this.ctx.jettonAddress);
    logger.success(
      `Successfully prepared (${account.address}) as the master wallet!`,
    );
  }

  /** Return funds to master */
  async returnFunds() {
    const { master } = this.ctx;

    if (master.address !== this.masterData.address) {
      logger.info("Returning funds into:", master.address);
      const walletTransfer = new AutoWalletTransfer(
        this.masterData,
        master.address,
        this.ctx.jettonAddress,
      );
      await walletTransfer.transfer();
      logger.success("Successfully transferred funds into:", master.address);
    }
  }
}

export default AutoMaster;
