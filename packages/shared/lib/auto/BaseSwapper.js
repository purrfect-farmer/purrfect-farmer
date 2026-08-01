import { SendMode, internal } from "@ton/core";
import {
  JETTON_TO_TON,
  TON_DECIMALS,
  buildSwapTxParams,
  fromUnits,
  getSwapAsset,
  resolveSwapAssets,
  simulateAutoSwap,
  toUnits,
} from "./swap.js";
import { prepareMaster, waitForSeqnoChange } from "./transactions.js";

import Decimal from "decimal.js";

/**
 * TON held back for swap gas. A STON.fi v2 jetton swap attaches 0.3 TON, far
 * more than the 0.08 a plain jetton transfer needs, so `TON_FOR_GAS` from
 * `transactions.js` is not a safe reserve here. The exact figure is checked
 * against the built message before signing; this is the friendly estimate the
 * form uses for its "Max" button and its up-front warning.
 */
export const SWAP_TON_RESERVE = new Decimal("0.35");

/**
 * BaseSwapper
 *
 * Swaps between a drop's jetton and TON on STON.fi, signing with the master
 * wallet. Mirrors `BaseWalletTransfer`: prepare the master, build one message,
 * send it, wait for the seqno to move.
 */
export default class BaseSwapper {
  constructor(master, jettonAddress, options = {}) {
    this.master = master;
    this.jettonAddress = jettonAddress;
    this.token = options.token;
    this.referralAddress = options.referralAddress;
  }

  /** Prepare the master once and reuse it across quote/swap calls */
  async prepare() {
    if (!this.prepared) {
      this.prepared = await prepareMaster(this.master, this.jettonAddress);
    }

    return this.prepared;
  }

  /**
   * Decimals for quoting. Read from STON.fi rather than `prepareMaster` so a
   * quote costs one cached HTTP call instead of decrypting the wallet and
   * hitting TonCenter.
   */
  async getJettonDecimals() {
    if (this.jettonDecimals === undefined) {
      const asset = await getSwapAsset(this.jettonAddress);
      this.jettonDecimals = asset.decimals;
    }

    return this.jettonDecimals;
  }

  /** Simulate a swap without signing anything */
  async quote({ direction, amount, slippage }) {
    const jettonDecimals = await this.getJettonDecimals();
    const assets = resolveSwapAssets(
      direction,
      this.jettonAddress,
      jettonDecimals,
    );

    const simulation = await simulateAutoSwap({
      offerAddress: assets.offerAddress,
      askAddress: assets.askAddress,
      offerUnits: toUnits(amount, assets.offerDecimals),
      slippageTolerance: slippage,
      referralAddress: this.referralAddress,
    });

    return this.describeSimulation(simulation, assets);
  }

  /** Turn raw units into the human figures the UI shows */
  describeSimulation(simulation, assets) {
    return {
      simulation,
      offered: fromUnits(simulation.offerUnits, assets.offerDecimals),
      expected: fromUnits(simulation.askUnits, assets.askDecimals),
      minReceived: fromUnits(simulation.minAskUnits, assets.askDecimals),
      rate: new Decimal(simulation.swapRate),
      priceImpact: new Decimal(simulation.priceImpact),
      routerVersion: simulation.router.majorVersion,
    };
  }

  /**
   * Execute the swap.
   *
   * Every balance check happens here, before anything is signed - a bad swap
   * cannot be undone once the message is on-chain.
   */
  async swap({ direction, amount, slippage }) {
    const prepared = await this.prepare();
    const { contract, keyPair, client, jettonDecimals } = prepared;

    const assets = resolveSwapAssets(
      direction,
      this.jettonAddress,
      jettonDecimals,
    );

    /** Guard rails */
    if (!Number(amount) || Number(amount) <= 0) {
      throw new Error("Enter an amount to swap");
    }

    const offerAmount = new Decimal(amount);
    const tonBalance = fromUnits(await contract.getBalance(), TON_DECIMALS);

    if (direction === JETTON_TO_TON) {
      if (offerAmount.gt(prepared.jettonBalance)) {
        throw new Error(
          `Not enough ${this.token} - master holds ${prepared.jettonBalance.toFixed()}`,
        );
      }

      /* A jetton swap still spends TON on gas, so an empty TON balance
       * strands the swap even though the jetton balance looks fine. */
      if (tonBalance.lt(SWAP_TON_RESERVE)) {
        throw new Error(
          `Not enough TON for gas - master needs at least ${SWAP_TON_RESERVE.toFixed()} TON`,
        );
      }
    } else {
      if (offerAmount.plus(SWAP_TON_RESERVE).gt(tonBalance)) {
        throw new Error(
          `Not enough TON - keep at least ${SWAP_TON_RESERVE.toFixed()} TON for gas`,
        );
      }
    }

    /* Re-simulate immediately before signing rather than trusting the quote
     * the form last displayed, which may be seconds stale. */
    const simulation = await simulateAutoSwap({
      offerAddress: assets.offerAddress,
      askAddress: assets.askAddress,
      offerUnits: toUnits(amount, assets.offerDecimals),
      slippageTolerance: slippage,
      referralAddress: this.referralAddress,
    });

    const txParams = await buildSwapTxParams({
      client,
      simulation,
      direction,
      userWalletAddress: this.master.address,
      referralAddress: this.referralAddress,
      queryId: Date.now(),
    });

    /* The router decides how much TON the message must carry, so this is the
     * only check that is exact. Anything short would burn gas and fail. */
    const required = fromUnits(txParams.value, TON_DECIMALS);

    if (required.gt(tonBalance)) {
      throw new Error(
        `Not enough TON - this swap needs ${required.toFixed(3)} TON but master holds ${tonBalance.toFixed(3)}`,
      );
    }

    const seqno = await contract.getSeqno();

    await contract.sendTransfer({
      seqno,
      secretKey: keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
      messages: [
        internal({
          to: txParams.to,
          value: txParams.value,
          body: txParams.body,
        }),
      ],
    });

    await waitForSeqnoChange(contract, seqno);

    /* The seqno moving proves the wallet sent the message, not that the pool
     * filled it - callers should word success as "submitted". */
    return this.describeSimulation(simulation, assets);
  }
}
