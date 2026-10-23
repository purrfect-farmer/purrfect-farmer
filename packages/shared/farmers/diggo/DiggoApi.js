import { CHEST_MODE } from "./constants.js";
import DiggoSession from "./DiggoSession.js";

/** The game's endpoints, one method per call */
export default class DiggoApi extends DiggoSession {
  /** The whole game state: balance, mining, tasks, friends, wallet */
  fetchState() {
    return this.getFromApi("/state");
  }

  /** Claim what the miner has produced, every eight hours */
  claimMining() {
    return this.writeToApi("/claims/mining");
  }

  /** Claim a task whose progress is complete */
  claimTask(taskId) {
    return this.writeToApi("/tasks/claim", { taskId });
  }

  /** Ask the backend to check the community membership */
  verifyTelegramTask() {
    return this.postToApi("/tasks/verify", { taskId: "telegram" });
  }

  /** Open a self-reported task, which returns the time it may be confirmed at */
  startSocialTask(taskId) {
    return this.postToApi("/tasks/social/start", { taskId });
  }

  /** Confirm a self-reported task once its wait is over */
  confirmSocialTask(taskId, attemptId) {
    return this.postToApi("/tasks/social/confirm", {
      taskId,
      attemptId,
      confirmed: true,
    });
  }

  /** Start an ad attempt, which AdsGram settles with the backend directly */
  startAd() {
    return this.postToApi("/adsgram/start");
  }

  /** Tell the backend the ad played to the end */
  completeAd(attemptId) {
    return this.postToApi("/adsgram/complete", { attemptId });
  }

  /** Give an ad attempt up */
  cancelAd(attemptId) {
    return this.postToApi("/adsgram/cancel", { attemptId });
  }

  /** Claim a day of the weekly streak */
  claimStreakDay(day) {
    return this.writeToApi("/streak/claim", { day });
  }

  /** Claim the commission the squad has mined */
  claimReferralCommission() {
    return this.writeToApi("/referrals/claim");
  }

  /** The holding chests and when each opens next */
  fetchChests() {
    return this.getFromApi(`/chests?mode=${CHEST_MODE}`);
  }

  /** Open a chest, once a day per chest */
  openChest(chestId) {
    return this.writeToApi("/chests/open", { chestId, mode: CHEST_MODE });
  }

  /** A fresh payload for the TON proof a wallet is bound with */
  fetchTonChallenge() {
    return this.postToApi("/ton/challenge");
  }

  /** Bind a wallet with its signed TON proof */
  bindWallet(data) {
    return this.postToApi("/ton/bind", data);
  }

  /** The jetton withdrawal rules, the withdrawable balance, the destination and any active request */
  fetchWithdrawalStatus() {
    return this.getFromApi("/jetton-withdrawals/status");
  }

  /** Price a jetton withdrawal of a DIGGO amount */
  quoteWithdrawal(amount) {
    return this.postToApi("/jetton-withdrawals/quote", { amount });
  }

  /** Request a jetton withdrawal of a DIGGO amount */
  requestWithdrawal(amount) {
    return this.writeToApi("/jetton-withdrawals/request", {
      amount,
      accepted: true,
    });
  }

  /** Cancel a jetton withdrawal that is still cancelable */
  cancelWithdrawal(id) {
    return this.postToApi("/jetton-withdrawals/cancel", { id });
  }

  /** A page of the account's jetton withdrawals, newest first */
  fetchWithdrawals(cursor) {
    return this.getFromApi(
      `/jetton-withdrawals${cursor ? `?${new URLSearchParams({ cursor })}` : ""}`,
    );
  }

  /** The one-time withdrawal activation */
  fetchActivation() {
    return this.getFromApi("/withdrawal-activation");
  }

  /** Have the backend check the bound wallet's age */
  checkActivation() {
    return this.postToApi("/withdrawal-activation/check");
  }

  /** Open the activation fee invoice */
  createActivationOrder() {
    return this.writeToApi("/withdrawal-activation/order", { accepted: true });
  }

  /** Have the backend build the activation fee transaction */
  prepareActivation(orderId) {
    return this.postToApi("/withdrawal-activation/prepare", { orderId });
  }

  /** Move the activation invoice to `submitted` once signed, or `rejected` */
  stageActivation(orderId, stage) {
    return this.postToApi("/withdrawal-activation/stage", { orderId, stage });
  }

  /** Open a risk challenge, which names the Turnstile to solve */
  startRiskChallenge() {
    return this.postToApi("/account/risk-challenge/start");
  }

  /** Answer a risk challenge with its Turnstile token */
  verifyRiskChallenge(challengeId, token) {
    return this.postToApi("/account/risk-challenge/verify", {
      challengeId,
      token,
    });
  }

  /** Report the low-entropy device signals the page sends after signing in */
  sendBrowserSignals(data) {
    return this.postToApi("/account/browser-signals", data);
  }

  /** The DEX transition flags, public and read before the state has them */
  fetchDexTransition() {
    return this.getFromApi("/dex-transition");
  }

  /** Price converting in-app TON into DIGGO */
  quoteConversion(amount) {
    return this.postToApi("/conversion/quote", { amount });
  }

  /** Confirm a quoted conversion */
  confirmConversion(quoteId) {
    return this.writeToApi("/conversion/confirm", {
      quoteId,
      accepted: true,
    });
  }

  /** Price a buy (TON in) or a sell (DIGGO in) */
  quoteMarket(side, amount) {
    return this.postToApi("/market/quote", { side, amount: String(amount) });
  }

  /** Execute a quoted sell, which settles into the in-app TON balance */
  executeTrade(quoteId) {
    return this.writeToApi("/market/trade", { quoteId });
  }

  /** Open a TON payment order for a quoted buy */
  createTonOrder(quoteId, acceptedExecution) {
    return this.writeToApi("/ton/orders", { quoteId, acceptedExecution });
  }

  /** Read a TON payment order */
  fetchTonOrder(orderId) {
    return this.getFromApi(`/ton/order?id=${encodeURIComponent(orderId)}`);
  }

  /** Move a TON payment order to `submitted` once signed, or `rejected` */
  stageTonOrder(orderId, stage) {
    return this.postToApi("/ton/order-stage", { orderId, stage });
  }

  /** The account's TON deposits */
  fetchDeposits() {
    return this.getFromApi("/ton/deposits");
  }

  /** Open a TON deposit into the in-app balance */
  createDeposit(amount) {
    return this.writeToApi("/ton/deposits", { amount: String(amount) });
  }

  /** Read a TON deposit */
  fetchDeposit(orderId) {
    return this.getFromApi(`/ton/deposit?id=${encodeURIComponent(orderId)}`);
  }

  /** Move a TON deposit to `submitted` once signed, or `rejected` */
  stageDeposit(orderId, stage) {
    return this.postToApi("/ton/deposit-stage", { orderId, stage });
  }

  /** Have the backend re-read the bound wallet's TON or DIGGO */
  refreshWalletBalance(asset) {
    return this.postToApi("/ton/balance", { asset });
  }
}
