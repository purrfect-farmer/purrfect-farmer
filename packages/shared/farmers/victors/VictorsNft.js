import FarmerModule from "../../lib/farmer/FarmerModule.js";
import {
  NFT_MINT_CHECK_ATTEMPTS,
  NFT_MINT_CHECK_SECONDS,
  NFT_MINT_FIRST_CHECK_SECONDS,
  NFT_MINT_GAS_TON,
} from "./constants.js";
import { Cell } from "@ton/core";
import Decimal from "decimal.js";
import { promptWalletVersion } from "../../lib/farmer/prompts.js";

/** Viewing and minting the drop's NFTs */
export default class VictorsNft extends FarmerModule {
  /** Log the collection and the account's own NFTs */
  async nftStatusInteractive() {
    await this.ctx.state.ensureLoaded();

    const nft = await this.ctx.api.fetchNft();
    const owned = nft["owned"] || [];

    this.logger.newline();
    this.logger.keyValue("Collection", nft["name"]);
    this.logger.keyValue("Minted", `${nft["minted"]} / ${nft["supply"]}`);
    this.logger.keyValue("Price", `${nft["priceTon"]} TON`);
    this.logger.keyValue("Sale Open", nft["saleOpen"] === false ? "No" : "Yes");
    this.logger.keyValue("Pending", nft["pending"] || 0);
    this.logger.keyValue(
      "Owned",
      owned.length
        ? owned.map((item) => `#${item["serial"]}`).join(", ")
        : "None",
    );

    return nft;
  }

  /** Poll the drop until it sees the mint, returning the minted serials */
  async pollNftMint() {
    for (let attempt = 0; attempt < NFT_MINT_CHECK_ATTEMPTS; attempt++) {
      if (this.signal.aborted) break;

      await this.utils.delayForSeconds(
        attempt === 0 ? NFT_MINT_FIRST_CHECK_SECONDS : NFT_MINT_CHECK_SECONDS,
        { signal: this.signal },
      );

      const result = await this.ctx.api.checkNftMint().catch(() => null);

      if (result?.["minted"]?.length) return result["minted"];
      if (result?.["nft"] && !result["nft"]["pending"]) break;
    }

    return [];
  }

  /** Pay for one NFT from the connected wallet's phrase, checking a mint already paid first */
  async mintNftInteractive() {
    await this.ctx.state.ensureLoaded();

    const connected = this.ctx.wallet.getConnectedWalletAddress();

    if (!connected) {
      this.logger.warn("Connect a wallet first.");
      return;
    }

    const nft = await this.nftStatusInteractive();
    const priceTon = new Decimal(nft["priceTon"] || 0);

    if (nft["saleOpen"] === false || nft["minted"] >= nft["supply"]) {
      this.logger.warn("The NFT sale is closed.");
      return;
    }

    /** A mint already paid is only checked, so it is never paid twice */
    if (nft["pending"]) {
      this.logger.info("A mint is pending, checking it...");
      const minted = await this.pollNftMint();

      if (minted.length) {
        this.logger.success(`Minted NFT #${minted.at(-1)}.`);
      } else {
        this.logger.warn("The pending mint has not landed yet.");
      }
      return;
    }

    const phrase = ((await this.core.prompt("Enter the wallet phrase:")) || "")
      .trim()
      .split(/\s+/)
      .join(" ");

    if (!phrase) {
      this.logger.warn("No phrase provided.");
      return;
    }

    const version = await promptWalletVersion(this.core);

    if (!version) {
      this.logger.warn("No wallet version selected.");
      return;
    }

    const wallet = this.utils.wallet.createTonWallet({ phrase, version });

    if (!this.utils.isSameTonAddress(connected, await wallet.getAddress())) {
      this.logger.warn("The phrase does not match the connected wallet.");
      return;
    }

    const tonBalance = await wallet
      .getBalance({ signal: this.signal })
      .catch(() => new Decimal(0));

    if (tonBalance.lessThan(priceTon.plus(NFT_MINT_GAS_TON))) {
      this.logger.warn(
        `Minting needs ${priceTon.plus(NFT_MINT_GAS_TON)} TON, the wallet holds ${tonBalance}.`,
      );
      return;
    }

    const confirm = await this.core.prompt({
      type: "select",
      text: `Pay ${priceTon} TON for one NFT?`,
      options: [
        { value: "no", label: "Cancel" },
        { value: "yes", label: "Mint" },
      ],
    });

    if (confirm !== "yes") return;

    const result = await this.ctx.api.startNftMint();
    const tx = result?.["tx"];

    if (!tx?.["address"] || !tx?.["amount"]) {
      this.logger.error(
        "Failed to start the mint:",
        result?.["error"] || "the drop returned no transfer",
      );
      return;
    }

    const seqno = await wallet.send({
      to: tx["address"],
      value: BigInt(tx["amount"]),
      body: tx["payload"] ? Cell.fromBase64(tx["payload"]) : tx["comment"],
    });

    await wallet.waitForConfirmation(seqno);
    this.logger.success(
      `Sent ${tx["amountTon"] ?? priceTon} TON for the mint.`,
    );

    const minted = await this.pollNftMint();

    if (minted.length) {
      this.logger.success(`Minted NFT #${minted.at(-1)}.`);
    } else {
      this.logger.warn(
        "The mint has not been seen yet, check NFT Status later.",
      );
    }
  }
}
