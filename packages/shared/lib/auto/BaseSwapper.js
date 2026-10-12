import { SendMode, internal } from "@ton/core";
import {
  JETTON_TO_TON,
  TON_DECIMALS,
  buildSwapTxParams,
  fromUnits,
  getSwapAsset,
  resolveSwapAssets,
  simulateRoute,
  toUnits,
} from "./swap.js";
import { prepareMaster } from "./transactions.js";
import { waitForSeqnoChange } from "../ton/transactions.js";

import Decimal from "decimal.js";

/** TON held back for swap gas, since a STON.fi v2 swap attaches far more than a plain jetton transfer */
export const SWAP_TON_RESERVE = new Decimal("0.35");

/** TON held back for a two-hop swap, which carries gas for both legs */
export const MULTI_HOP_TON_RESERVE = new Decimal("0.6");

/** TON a route needs left over for gas */
export function getSwapTonReserve(hops = 1) {
  return hops > 1 ? MULTI_HOP_TON_RESERVE : SWAP_TON_RESERVE;
}

/** Swaps between a drop's jetton and TON on STON.fi, signing with any Auto wallet */
export default class BaseSwapper {
  constructor(wallet, jettonAddress, options = {}) {
    this.wallet = wallet;
    this.jettonAddress = jettonAddress;
    this.token = options.token;
    this.referralAddress = options.referralAddress;
  }

  /** Prepare the wallet once and reuse it across quote/swap calls */
  async prepare() {
    if (!this.prepared) {
      this.prepared = await prepareMaster(this.wallet, this.jettonAddress);
    }

    return this.prepared;
  }

  /** Decimals for quoting, read from STON.fi so a quote costs one cached call */
  async getJettonDecimals() {
    if (this.jettonDecimals === undefined) {
      const asset = await getSwapAsset(this.jettonAddress);
      this.jettonDecimals = asset.decimals;
    }

    return this.jettonDecimals;
  }

  /** Simulate the swap's route for an amount */
  simulate({ direction, amount, slippage }, assets) {
    return simulateRoute({
      direction,
      jettonAddress: this.jettonAddress,
      offerUnits: toUnits(amount, assets.offerDecimals),
      slippageTolerance: slippage,
      referralAddress: this.referralAddress,
    });
  }

  /** Simulate a swap without signing anything */
  async quote({ direction, amount, slippage }) {
    const jettonDecimals = await this.getJettonDecimals();
    const assets = resolveSwapAssets(
      direction,
      this.jettonAddress,
      jettonDecimals,
    );

    const route = await this.simulate({ direction, amount, slippage }, assets);

    return this.describeRoute(route, direction, assets);
  }

  /** Turn raw units into the human figures the UI shows */
  describeRoute(route, direction, assets) {
    const first = route.hops[0];
    const last = route.hops.at(-1);
    const offered = fromUnits(first.offerUnits, assets.offerDecimals);
    const expected = fromUnits(last.askUnits, assets.askDecimals);

    /* Impacts compound across legs */
    const priceImpact = new Decimal(1).minus(
      route.hops.reduce(
        (kept, hop) => kept.mul(new Decimal(1).minus(hop.priceImpact)),
        new Decimal(1),
      ),
    );

    const [from, to] =
      direction === JETTON_TO_TON ? [this.token, "TON"] : ["TON", this.token];

    return {
      route,
      hops: route.hops.length,
      path: [from, ...(route.via ? [route.via.symbol] : []), to],
      offered,
      expected,
      minReceived: fromUnits(last.minAskUnits, assets.askDecimals),
      rate: offered.gt(0) ? expected.div(offered) : new Decimal(0),
      priceImpact,
    };
  }

  /** Execute the swap, checking every balance before anything is signed */
  async swap({ direction, amount, slippage }) {
    const prepared = await this.prepare();
    const { contract, client, keyPair, jettonDecimals } = prepared;

    const assets = resolveSwapAssets(
      direction,
      this.jettonAddress,
      jettonDecimals,
    );

    /** Guard rails */
    if (!Number(amount) || Number(amount) <= 0) {
      throw new Error("Enter an amount to swap");
    }

    /* Re-simulate immediately before signing rather than trusting the quote the form last displayed */
    const route = await this.simulate({ direction, amount, slippage }, assets);
    const reserve = getSwapTonReserve(route.hops.length);

    const offerAmount = new Decimal(amount);
    const tonBalance = fromUnits(await contract.getBalance(), TON_DECIMALS);

    if (direction === JETTON_TO_TON) {
      if (offerAmount.gt(prepared.jettonBalance)) {
        throw new Error(
          `Not enough ${this.token} - wallet holds ${prepared.jettonBalance.toFixed()}`,
        );
      }

      /* A jetton swap still spends TON on gas */
      if (tonBalance.lt(reserve)) {
        throw new Error(
          `Not enough TON for gas - wallet needs at least ${reserve.toFixed()} TON`,
        );
      }
    } else if (offerAmount.plus(reserve).gt(tonBalance)) {
      throw new Error(
        `Not enough TON - keep at least ${reserve.toFixed()} TON for gas`,
      );
    }

    const txParams = await buildSwapTxParams({
      client,
      route,
      direction,
      userWalletAddress: this.wallet.address,
      referralAddress: this.referralAddress,
      queryId: Date.now(),
    });

    /* The router decides how much TON the message must carry, so this is the only exact check */
    const required = fromUnits(txParams.value, TON_DECIMALS);

    if (required.gt(tonBalance)) {
      throw new Error(
        `Not enough TON - this swap needs ${required.toFixed(3)} TON but wallet holds ${tonBalance.toFixed(3)}`,
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

    /* The seqno moving proves the wallet sent the message, not that the pool filled it */
    return this.describeRoute(route, direction, assets);
  }
}
