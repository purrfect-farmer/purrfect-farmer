import { SendMode, internal } from "@ton/core";
import {
  JETTON_TO_TON,
  TON_DECIMALS,
  TON_TO_JETTON,
  buildSwapTxParams,
  fromUnits,
  getSwapAsset,
  resolveSwapAssets,
  simulateRoute,
  toUnits,
} from "./swap.js";
import { NATIVE_TON_DUST, fromNanoDecimal } from "./native.js";
import { prepareMaster } from "./transactions.js";
import { sendAndConfirm } from "../ton/transactions.js";

import Decimal from "decimal.js";

/** TON held back for swap gas, since a STON.fi v2 swap attaches far more than a plain jetton transfer */
export const SWAP_TON_RESERVE = new Decimal("0.35");

/** TON held back for a two-hop swap, which carries gas for both legs */
export const MULTI_HOP_TON_RESERVE = new Decimal("0.6");

/** Above this an unattended swap refuses, since the pool would eat most of it */
export const MAX_PRICE_IMPACT = new Decimal("0.1");

/** TON a route needs left over for gas */
export function getSwapTonReserve(hops = 1) {
  return hops > 1 ? MULTI_HOP_TON_RESERVE : SWAP_TON_RESERVE;
}

/** A route's total price impact, compounded across its legs */
export function getRoutePriceImpact(route) {
  return new Decimal(1).minus(
    route.hops.reduce(
      (kept, hop) => kept.mul(new Decimal(1).minus(hop.priceImpact)),
      new Decimal(1),
    ),
  );
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

    const priceImpact = getRoutePriceImpact(route);

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

    await sendAndConfirm(
      contract,
      keyPair,
      [
        internal({
          to: txParams.to,
          value: txParams.value,
          body: txParams.body,
        }),
      ],
      SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    );

    /* The seqno moving proves the wallet sent the message, not that the pool filled it */
    return this.describeRoute(route, direction, assets);
  }

  /** Swap all of the wallet's TON into the jetton, keeping the gas its route needs */
  async swapAll({ slippage }) {
    const prepared = await this.prepare();
    const balance = fromUnits(
      await prepared.contract.getBalance(),
      TON_DECIMALS,
    );
    const dust = fromNanoDecimal(NATIVE_TON_DUST);

    /** What is left to offer once a reserve is held back, null when it is not worth a swap */
    const available = (reserve) => {
      const amount = balance.minus(reserve);
      return amount.gt(dust) ? amount : null;
    };

    let amount = available(getSwapTonReserve(1));

    if (!amount) {
      return { status: false, skipped: true, balance };
    }

    /* The route decides the reserve, and a two-hop one needs more gas */
    const assets = resolveSwapAssets(
      TON_TO_JETTON,
      this.jettonAddress,
      prepared.jettonDecimals,
    );
    const route = await this.simulate(
      { direction: TON_TO_JETTON, amount: amount.toFixed(), slippage },
      assets,
    );

    /* Nobody is watching to back out of a thin pool */
    const priceImpact = getRoutePriceImpact(route);

    if (priceImpact.gt(MAX_PRICE_IMPACT)) {
      throw new Error(
        `Price impact ${priceImpact.mul(100).toFixed(2)}% is too high`,
      );
    }

    if (route.hops.length > 1) {
      amount = available(getSwapTonReserve(route.hops.length));

      if (!amount) {
        return { status: false, skipped: true, balance };
      }
    }

    const result = await this.swap({
      direction: TON_TO_JETTON,
      amount: amount.toFixed(),
      slippage,
    });

    return {
      status: true,
      balance,
      swapped: amount,
      expected: result.expected,
      path: result.path,
    };
  }
}
