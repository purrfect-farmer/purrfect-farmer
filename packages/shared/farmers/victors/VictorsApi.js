import { WITHDRAWAL_HISTORY_LIMIT } from "./constants.js";
import VictorsSession from "./VictorsSession.js";

/** The drop's endpoints, one method per call */
export default class VictorsApi extends VictorsSession {
  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** Sign in with a solved Turnstile token, registering the referrer on first contact */
  loginWithToken(turnstileToken) {
    return this.callApi(
      "post",
      "/auth/login",
      {
        startParam: this.getReferrerStartParam(),
        turnstileToken,
        device: this.getDevice().getLoginDevice(),
      },
      { retryHuman: false },
    );
  }

  /** The full account state */
  fetchMe() {
    return this.getFromApi("/me");
  }

  /** The task board, with each task's status for this account */
  fetchTasks() {
    return this.getFromApi("/tasks").then((result) => result["tasks"] || []);
  }

  /** The newest history rows */
  fetchTransactions(limit = WITHDRAWAL_HISTORY_LIMIT) {
    return this.getFromApi(`/transactions?limit=${limit}`).then(
      (result) => result["transactions"] || [],
    );
  }

  /** The crew the account has recruited */
  fetchFriends() {
    return this.getFromApi("/friends").then(
      (result) => result["friends"] || [],
    );
  }

  /** Mark the tutorial as seen */
  completeTutorial() {
    return this.postToApi("/me/tutorial");
  }

  /** Claim today's check-in */
  checkIn() {
    return this.postToApi("/checkin");
  }

  /** Claim what the session has mined */
  claimMining() {
    return this.postToApi("/mining/claim");
  }

  /** Hire the miner of a level the holding covers */
  unlockLevel(level) {
    return this.postToApi("/levels/unlock", { level });
  }

  /** Claim one task */
  claimTask(taskId) {
    return this.postToApi("/tasks/claim", { taskId });
  }

  /** Claim the hiring bonus for qualified referrals */
  claimReferralBonus() {
    return this.postToApi("/referral/claim-bonus");
  }

  /** Claim the commission the crew has mined */
  claimReferralCommission() {
    return this.postToApi("/referral/claim-commission");
  }

  /** Bind a wallet to the account, proven as its owner when a TON proof comes along */
  connectWallet(address, ownership) {
    return this.postToApi("/wallet/connect", { address, ...ownership });
  }

  /** Unbind the wallet the account is on */
  disconnectWallet() {
    return this.postToApi("/wallet/disconnect");
  }

  /** Ask the drop to re-read the wallet's on-chain holding */
  refreshWallet() {
    return this.postToApi("/wallet/refresh");
  }

  /** Get the verification transfer the drop expects */
  startVerification() {
    return this.postToApi("/wallet/verify/start");
  }

  /** Ask the drop whether the verification transfer has landed */
  checkVerification() {
    return this.postToApi("/wallet/verify/check");
  }

  /** A fresh payload for the TON proof a wallet is bound with */
  fetchProofPayload() {
    return this.getFromApi("/wallet/proof-payload").then(
      (result) => result["payload"],
    );
  }

  /** The arcade's games, plays left and any run in progress */
  fetchArcade() {
    return this.getFromApi("/arcade");
  }

  /** Underground's daily pools and the account's plays left */
  fetchUnderground() {
    return this.getFromApi("/underground");
  }

  /** Buy gear and start a Deep Mine run */
  startMineRun(tool, items = {}) {
    return this.postToApi("/arcade/mine/start", {
      tool,
      items: { helmet: 0, drink: 0, scanner: 0, bomb: 0, ...items },
    });
  }

  /** Break one block */
  digMine(x, y) {
    return this.postToApi("/arcade/mine/dig", { x, y });
  }

  /** Use an item at an open block */
  useMineItem(item, x, y) {
    return this.postToApi("/arcade/mine/use", { item, x, y });
  }

  /** Climb out, cashing the bag and the unused energy */
  endMineRun() {
    return this.postToApi("/arcade/mine/end");
  }

  /** Request a payout to the connected wallet, with the device fingerprint the page sends */
  requestWithdrawal(amount) {
    return this.postToApi("/withdraw", {
      amount: Number(amount),
      forensics: this.getDevice().getForensics(),
    });
  }

  /** Wipe a banned account, accepting the terms the ban names */
  resetAccount(termsVersion) {
    return this.callApi(
      "post",
      "/auth/reset",
      { agree: true, termsVersion },
      { retryHuman: false },
    );
  }

  /** The NFT collection, with the account's own NFTs */
  fetchNft() {
    return this.getFromApi("/nft").then((result) => result["nft"] || {});
  }

  /** Get the mint transfer the drop expects */
  startNftMint() {
    return this.postToApi("/nft/mint/start");
  }

  /** Ask the drop whether a mint transfer has landed */
  checkNftMint() {
    return this.postToApi("/nft/mint/check");
  }
}
