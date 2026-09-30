import Decimal from "decimal.js";
import logger from "../logger.js";
import { getWalletAddressFromMnemonic } from "@purrfect/shared/lib/auto/wallet.js";

/** Connects accounts to wallets on the drop, and waits the drop out once it has */
class AutoWallet {
  /** @param {import("./AutoContext.js").default} ctx */
  constructor(ctx) {
    this.ctx = ctx;
  }

  /** Connect a runner to a wallet, throwing when the drop refuses it */
  async connectOrThrow(runner, params, label = "Failed to connect wallet") {
    const result = await runner.connectAutoWallet(params);

    if (!result.status) {
      throw new Error(result.message || label);
    }

    return result;
  }

  /** Connect an account's wallet after a boost, retrying, then settle, mine and hand it back to farming */
  async connect({ cloudAccount, walletAccount, jettonAmount }) {
    /** Seconds of delay before retry */
    const RETRY_SECONDS = 1;

    /** Maximum attempts */
    const MAX_ATTEMPTS = 3;

    let attempts = 0;
    let errorMessage;

    /** Only a boosted wallet needs the drop to re-read it */
    const boosted = new Decimal(jettonAmount || 0).greaterThan(0);

    while (attempts < MAX_ATTEMPTS) {
      /** Stop retrying once the operation is cancelled */
      if (this.ctx.aborted) {
        return { status: false, message: "Operation cancelled!" };
      }

      try {
        logger.info(
          "Connecting Wallet:",
          cloudAccount.id,
          walletAccount.address,
        );

        const runner = await this.ctx.getRunner(cloudAccount);

        /** Connect and sync */
        const { summary } = await this.connectOrThrow(runner, {
          phrase: walletAccount.phrase,
          address: walletAccount.address,
          version: walletAccount.version,
          refresh: boosted,
        });

        logger.success(
          "Connected Wallet:",
          cloudAccount.id,
          walletAccount.address,
        );

        /** Wait for the boosted tokens to show up in the drop's view */
        const { summary: settledSummary, settled } =
          await this.syncBoostedHolding({
            runner,
            cloudAccount,
            summary,
            jettonAmount,
          });

        /** Put the holding to work */
        const minedSummary = await this.startMining(
          runner,
          cloudAccount,
          settledSummary,
        );

        await this.handBack(runner, cloudAccount, minedSummary);

        return { status: true, summary: minedSummary, settled, runner };
      } catch (e) {
        errorMessage = e.message;
        logger.error(
          "Failed to connect wallet:",
          cloudAccount.id,
          walletAccount.address,
          errorMessage,
        );
        attempts++;

        if (attempts < MAX_ATTEMPTS) {
          logger.info(
            `Retrying in ${RETRY_SECONDS}s... (${attempts}/${MAX_ATTEMPTS})`,
          );
          await this.ctx.delaySeconds(RETRY_SECONDS, { precised: true });
        }
      }
    }

    return { status: false, message: errorMessage };
  }

  /** Set the farmer's status for the freeze setting and run it, never failing the connect */
  async handBack(runner, cloudAccount, summary) {
    try {
      if (runner.farmer) {
        const freeze = this.ctx.shouldFreezeAccounts();

        /** The drop reports when mining freezes, which is when the account is due back */
        const freezesAt = Number(summary?.mining?.freezesAt) || 0;

        runner.farmer.status = freeze ? "frozen" : "active";

        /** No reported window means the freeze stays indefinite */
        runner.farmer.frozenUntil =
          freeze && freezesAt ? new Date(freezesAt * 1000) : null;

        await runner.farmer.save();
      }

      /** Execute runner, skipped when the run is only meant to register wallets */
      if (this.ctx.options.runFarmer) {
        await this.ctx.delaySeconds(1);

        await runner.start();
      }
    } catch (e) {
      logger.error(
        "Failed to set farmer status and start runner:",
        cloudAccount.id,
        e.message,
      );
    }
  }

  /** Start mining at the holding the account is now on, once the boost has settled */
  async startMining(runner, cloudAccount, summary) {
    try {
      logger.info("Starting mining:", cloudAccount.id);

      const mined = await runner.startAutoMining();

      logger.success("Started mining:", cloudAccount.id);

      return mined || summary;
    } catch (e) {
      logger.error("Failed to start mining:", cloudAccount.id, e.message);
      return summary;
    }
  }

  /** Re-read the account until the drop sees the tokens the boost sent */
  async syncBoostedHolding({ runner, cloudAccount, summary, jettonAmount }) {
    /** Seconds of delay between re-syncs */
    const RETRY_SECONDS = 5;

    /** Maximum re-syncs, i.e. how long the transfer is given to land */
    const MAX_ATTEMPTS = 20;

    const { token } = this.ctx;
    const expected = new Decimal(jettonAmount || 0);

    /** Nothing was sent, so whatever the drop reports is already current */
    if (expected.lessThanOrEqualTo(0)) {
      return { summary, settled: true };
    }

    let current = summary;
    let attempts = 0;

    while (true) {
      const holding = new Decimal(current?.holding || 0);

      if (holding.greaterThanOrEqualTo(expected)) {
        if (attempts > 0) {
          logger.success(
            "Boost settled:",
            cloudAccount.id,
            `${holding} / ${expected} ${token}`,
          );
        }
        return { summary: current, settled: true };
      }

      if (attempts >= MAX_ATTEMPTS) break;

      attempts++;

      logger.warn(
        "Waiting for boost to land:",
        cloudAccount.id,
        `${holding} / ${expected} ${token}`,
        `(${attempts}/${MAX_ATTEMPTS})`,
      );

      await this.ctx.delaySeconds(RETRY_SECONDS);

      try {
        current = await runner.refreshAutoSummary();
      } catch (e) {
        /** Keep the last summary and try again */
        logger.error("Failed to refresh account:", cloudAccount.id, e.message);
      }
    }

    logger.warn(
      "Boost never settled:",
      cloudAccount.id,
      `${new Decimal(current?.holding || 0)} / ${expected} ${token}`,
    );

    return { summary: current, settled: false };
  }

  /** Hand an account back to farming, since reading a frozen account is also what releases it */
  async activateFarmer(runner, cloudAccount) {
    try {
      if (runner.farmer && runner.farmer.status !== "active") {
        runner.farmer.status = "active";
        runner.farmer.errorCount = 0;
        runner.farmer.frozenUntil = null;
        await runner.farmer.save();
      }
    } catch (e) {
      logger.error(
        "Failed to activate the farmer:",
        cloudAccount.id,
        e.message,
      );
    }
  }

  /** Re-sync the wallet, which is the only call that makes the drop read it on-chain again.
   * A plain login never recomputes the DEX buyer standing, so this is both the cheapest
   * repair and the measurement that says whether the standing was ever really lost. */
  async resync(runner, walletAccount) {
    const { summary } = await this.connectOrThrow(
      runner,
      {
        phrase: walletAccount.phrase,
        version: walletAccount.version,
        refresh: true,
      },
      "Failed to re-sync the wallet",
    );

    return summary;
  }

  /** Connect an account to one of its phrase's contract versions, keeping the snapshot on it */
  async connectVersion(runner, phrase, version) {
    const address = await getWalletAddressFromMnemonic(phrase, version);

    await this.connectOrThrow(runner, { phrase, address, version });

    await runner.storeAutoSnapshot();

    return address;
  }
}

export default AutoWallet;
