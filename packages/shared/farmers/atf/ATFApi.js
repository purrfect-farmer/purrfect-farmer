import FarmerModule from "../../lib/farmer/FarmerModule.js";
import { TAP_V2_BATCH_MAX } from "./constants.js";

/** The drop's API: one method per action */
export default class ATFApi extends FarmerModule {
  /* --------------------------------------------------------------------- */
  /* Transport                                                             */
  /* --------------------------------------------------------------------- */

  /** Post one action to the drop, returning the response body */
  makeAction(action, data = {}, config = {}) {
    return this.api
      .post(
        `https://atfminers.asloni.online/miner/index.php?action=${action}`,
        data,
        config,
      )
      .then((res) => res.data);
  }

  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** Get Captcha Status */
  getCaptchaStatus() {
    return this.makeAction("captcha_status", {
      username: this.core.username() || "",
    });
  }

  /** Verify Entry Captcha */
  verifyEntryCaptcha(captchaToken) {
    return this.makeAction("verify_entry_captcha", {
      captcha_token: captchaToken,
      username: this.core.username() || "",
    });
  }

  /** Verify Entry Risk Captcha */
  verifyEntryRiskCaptcha({ challengeId, answer }) {
    return this.makeAction(
      "verify_entry_risk_captcha",
      {
        challenge_id: challengeId,
        captcha_answer: answer,
      },
      this.core.drop.RISK_CHALLENGE_CONFIG,
    );
  }

  /** Connect to Toobit */
  connectToobitUid(uid = "") {
    return this.makeAction("toobit_connect", {
      uid,
    });
  }

  /** Get Toobit Status */
  getToobitStatus() {
    return this.makeAction("toobit_status");
  }

  /** Disconnect Toobit */
  disconnectToobitUid() {
    return this.makeAction("toobit_disconnect");
  }

  /** Check Toobit KYC, which the live app no longer calls */
  checkToobitKyc() {
    return this.makeAction("toobit_check_kyc", {
      request_id:
        "kyc_" +
        Date.now().toString(36) +
        "_" +
        Math.random().toString(36).slice(2, 12),
    });
  }

  /** Claim Mining */
  claimMining(amount) {
    return this.makeAction("claim", {
      claim_preview: Number(amount),
    });
  }

  /** Activate Boost */
  activateBoost(preview) {
    return this.makeAction("activate_boost", {
      display_preview: Number(preview),
    });
  }

  /** Claim Task */
  claimTask(taskId, clientStartedAt = 0) {
    return this.makeAction("claim_task", {
      task_id: taskId,
      client_started_at: clientStartedAt,
    });
  }

  /** Start Task */
  startTask(taskId, clientStartedAt = 0) {
    return this.makeAction("start_task", {
      task_id: taskId,
      client_started_at: clientStartedAt,
    });
  }

  /** Disconnect Wallet */
  disconnectWallet(wallet) {
    return this.makeAction("disconnect_wallet", {
      wallet,
      disconnect_intent: "explicit_user",
    });
  }

  /** Sync Wallet */
  syncWallet({
    publicKey,
    wallet,
    walletStateInit,
    network,
    proof,
    refreshHolding = 1,
  }) {
    return this.makeAction("sync_wallet", {
      refresh_holding: refreshHolding,
      public_key: publicKey || "",
      wallet_state_init: walletStateInit || "",
      wallet: wallet || "",
      network: network || "",
      proof: proof || null,
      fg_visible: 1,
      fg_epoch: this.ctx.activity.getForegroundEpoch(),
      activity_lease: this.ctx.session.activityLeaseToken || "",
    });
  }

  /** Get Bio Task Status */
  getBioTaskStatus() {
    return this.makeAction("bio_task_status");
  }

  /** Claim Bio Task */
  claimBioTask() {
    return this.makeAction("bio_task_claim");
  }

  /** Get Name Eye Task Status */
  getNameEyeTaskStatus() {
    return this.makeAction("name_eye_task_status");
  }

  /** Claim Name Eye Task */
  claimNameEyeTask() {
    return this.makeAction("name_eye_task_claim");
  }

  /** Get Tap V2 State (tap_locked, engagement_mode, session_nonce, last_seq, energy, energy_cost, reward_per_tap, boost_finishing_until) */
  getTapV2State() {
    return this.makeAction("tap_v2_state", {
      client_instance: this.ctx.mining.getTapV2ClientInstance(),
    });
  }

  /** Sync Tap V2 batch, seq is last_seq + 1 then next_seq from each reply */
  syncTapV2({ sessionNonce, seq, taps }) {
    return this.makeAction("tap_v2_sync", {
      client_instance: this.ctx.mining.getTapV2ClientInstance(),
      session_nonce: sessionNonce,
      seq,
      batch_id: this.ctx.mining.createTapV2Id(
        `b_${Date.now().toString(36)}_`,
        3,
      ),
      taps: Math.min(TAP_V2_BATCH_MAX, taps),
    });
  }

  /** Resync Wallet */
  resyncWallet() {
    return this.syncWallet({
      refreshHolding: 0,
      wallet: this.ctx.state.data?.user?.["wallet_address"],
    });
  }

  /** Get Wallet Proof Payload */
  getWalletProofPayload() {
    return this.makeAction("get_wallet_proof_payload", { force: 1 });
  }

  /** Get Friends */
  getFriends() {
    return this.makeAction("get_friends", {
      friends_db_offset: 0,
      friends_pending_offset: 0,
    });
  }

  /** Get Withdraw History */
  getWithdrawHistory() {
    return this.makeAction("get_withdraw_history");
  }

  /** Claim Referrals */
  claimReferrals() {
    return this.makeAction("claim_referrals");
  }

  /** Claim Team Wallet */
  claimTeamWallet() {
    return this.makeAction("claim_team_wallet");
  }

  /** Get Withdrawal Puzzle */
  getWithdrawalPuzzle(amount) {
    return this.makeAction("get_withdraw_puzzle", { amount: Number(amount) });
  }

  /** Request Withdrawal */
  requestWithdrawal(data) {
    return this.makeAction("withdraw", data);
  }

  /** Get Math Challenge */
  getMathChallenge(scope) {
    return this.makeAction("get_math_challenge", {
      scope: scope,
    });
  }

  /** Start Mining */
  startMining({ challengeId, answer }) {
    return this.makeAction("start_mine", {
      math_challenge_id: challengeId,
      math_answer: answer,
    });
  }

  /** Get Difficulty */
  getDifficulty() {
    return this.makeAction("get_difficulty");
  }
}
