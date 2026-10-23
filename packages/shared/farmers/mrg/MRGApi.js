/** Trait: the drop's endpoints, one method per call */
export default class MRGApi {
  /* --------------------------------------------------------------------- */
  /* Endpoints                                                             */
  /* --------------------------------------------------------------------- */

  /** Sign in, creating the account on first contact and registering the referrer with it */
  verifyAccount() {
    return this.postToApi("/auth/verify", {
      startParam: this.getReferrerStartParam(),
      deviceInfo: this.getDeviceInfo(),
    });
  }

  /** The full account state: user, level, tasks, transactions */
  fetchAccount() {
    return this.postToApi("/user/me", { deviceInfo: this.getDeviceInfo() });
  }

  /** Trade a solved Turnstile token for a few hours of human check */
  verifyHuman(turnstileToken) {
    return this.callApi(
      "/user/verify-human",
      { turnstileToken },
      { retryHuman: false },
    );
  }

  /** The squad and its commission counters */
  fetchFriends() {
    return this.postToApi("/user/friends");
  }

  /** The week's earnings, which the page reads on load */
  fetchPnlHistory() {
    return this.postToApi("/user/pnl-history", {
      tzOffsetMinutes: -new Date().getTimezoneOffset(),
    });
  }

  /** Mark the account as present, as the page does every 30s while visible */
  ping() {
    return this.postToApi("/user/ping");
  }

  /** Mark the account as gone, as the page does when it is hidden or closed */
  leavePresence() {
    return this.postToApi("/user/presence-leave");
  }

  /** A fresh payload for the TON proof a new wallet is bound with */
  async fetchTonProofPayload() {
    const result = await this.postToApi("/user/ton-proof-payload");

    if (!result?.["success"] || typeof result["payload"] !== "string") {
      throw new Error(result?.["error"] || "Failed to get a TON proof payload");
    }

    return result["payload"];
  }

  /** Bind a wallet and report the holding, with a TON proof unless the wallet is already bound */
  connectWallet(address, balance, tonProof) {
    return this.postToApi("/user/connect-wallet", {
      address,
      balance,
      tonProof: tonProof || undefined,
    });
  }

  /** Unbind the wallet the account is on */
  disconnectWallet() {
    return this.postToApi("/user/disconnect-wallet");
  }

  /** Claim everything mined since the last sync */
  claimMining() {
    return this.postToApi("/user/claim-mining");
  }

  /** Claim one task */
  claimTask(taskId) {
    return this.postToApi("/user/claim-task", { taskId });
  }

  /** Check in for the day, which pays by streak */
  dailyCheckIn() {
    return this.postToApi("/user/daily-checkin");
  }

  /** The on-chain verification the drop wants before a withdrawal, with the transfer it expects */
  fetchVerificationInfo() {
    return this.postToApi("/user/onchain-verify/info");
  }

  /** Ask the drop whether the verification transfer has landed */
  checkVerification() {
    return this.postToApi("/user/onchain-verify/check");
  }

  /** Claim the one-time bonus earned by qualified referrals */
  claimOneTimeBonus() {
    return this.postToApi("/user/claim-one-time-bonus");
  }

  /** Claim the commission the squad has mined */
  claimTeamCommission() {
    return this.postToApi("/user/claim-commission");
  }

  /** Unlock a level, which the backend grants against the wallet holding */
  unlockLevel(level) {
    return this.postToApi("/user/unlock-level", { level });
  }

  /** Get a slider puzzle, which a withdrawal must be accompanied by */
  createCaptcha() {
    return this.postToApi("/captcha/create");
  }

  /** Answer a slider puzzle with where the piece was dropped and the drag that put it there */
  verifyCaptcha(captchaId, sliderX, trace) {
    return this.postToApi("/captcha/verify", { captchaId, sliderX, trace });
  }

  /** Request a payout to the connected wallet, with the device fingerprint the page sends */
  requestWithdrawal(amount, destinationAddress, captchaToken, turnstileToken) {
    return this.postToApi("/user/withdraw", {
      amount: Number(amount),
      destinationAddress,
      captchaToken,
      turnstileToken,
      deviceInfo: this.getDeviceInfo(),
      forensics: this.getDevice().getForensics(),
    });
  }
}
