import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { fetchTonApi } from "../../lib/ton/tonapi.js";
import {
  GENESIS_NFT_COLLECTION,
  NFT_BUNDLE_DISCOUNT,
  NFT_BUNDLE_SIZE,
  NFT_RARITY_DISCOUNTS,
  WITHDRAWAL_FEE,
} from "./constants.js";
import Decimal from "decimal.js";

/** Genesis NFTs and the withdrawal fee discount they earn */
export default class MRGNft extends FarmerModule {
  /** The account's Genesis NFTs, once read this run */
  nftHoldings = null;

  /** Forget the NFTs read, so the next read asks the chain again */
  reset() {
    this.nftHoldings = null;
  }

  /* --------------------------------------------------------------------- */
  /* Genesis NFTs                                                          */
  /* --------------------------------------------------------------------- */

  /** The account's Genesis NFTs, read once per run */
  async readNftHoldings(address = this.ctx.wallet.getConnectedWalletAddress()) {
    if (!address) return [];
    if (this.nftHoldings) return this.nftHoldings;

    return (this.nftHoldings = await this.fetchNftHoldings(address));
  }

  /** Ask TonAPI for the address' Genesis NFTs, grouped by rarity */
  async fetchNftHoldings(address) {
    const response = await fetchTonApi(
      `/accounts/${address}/nfts?collection=${GENESIS_NFT_COLLECTION}&limit=50&indirect_ownership=true`,
      { signal: this.signal },
    ).catch((error) => {
      this.logger.warn("Failed to read NFTs on-chain:", error.message);
      return null;
    });

    const holdings = new Map();

    for (const item of response?.data?.["nft_items"] || []) {
      const rarity = this.getNftRarity(item);
      const holding = holdings.get(rarity);

      if (holding) {
        holding.quantity += 1;
      } else {
        holdings.set(rarity, {
          name: rarity.charAt(0).toUpperCase() + rarity.slice(1),
          type: rarity,
          quantity: 1,
        });
      }
    }

    return [...holdings.values()];
  }

  /** An NFT's rarity, from its `Rarity` attribute or, failing that, its name */
  getNftRarity(item) {
    const attributes = item?.["metadata"]?.["attributes"];
    const attribute = Array.isArray(attributes)
      ? attributes.find((entry) => entry["trait_type"] === "Rarity")?.["value"]
      : null;

    const rarity = String(
      attribute || item?.["metadata"]?.["name"] || "",
    ).toLowerCase();

    if (rarity.includes("mythic")) return "mythical";
    if (rarity.includes("rare")) return "rare";

    return "common";
  }

  /** How many NFTs the holdings add up to */
  countNftHoldings(holdings) {
    return (holdings || []).reduce(
      (total, holding) => total + (holding.quantity || 0),
      0,
    );
  }

  /** What the holdings take off the withdrawal fee, in percent */
  getNftDiscountPercent(holdings) {
    if (!holdings?.length) return 0;

    /** Any three earn more together than the rarest of them earns alone */
    if (this.countNftHoldings(holdings) >= NFT_BUNDLE_SIZE) {
      return NFT_BUNDLE_DISCOUNT;
    }

    return holdings.reduce(
      (best, holding) =>
        holding.quantity > 0
          ? Math.max(best, NFT_RARITY_DISCOUNTS[holding.type] || 0)
          : best,
      0,
    );
  }

  /** The discount the account's NFTs earn it, never below what the drop itself reports */
  async readNftDiscountPercent() {
    return Math.max(
      this.getNftDiscountPercent(await this.readNftHoldings()),
      Number(this.ctx.state.data?.user?.["nftDiscountPercent"]) || 0,
    );
  }

  /** The withdrawal fee once the NFT discount is applied */
  getWithdrawalFee(discountPercent = 0) {
    const fee = new Decimal(WITHDRAWAL_FEE);

    return Decimal.max(fee.minus(fee.mul(discountPercent).div(100)), 0);
  }
}
