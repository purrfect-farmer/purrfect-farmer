import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "../../lib/farmer/AutoWalletConnector.js";
import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  PENDING_WITHDRAWAL_STATUSES,
} from "./constants.js";
import VictorsAccount from "./VictorsAccount.js";
import VictorsApi from "./VictorsApi.js";
import VictorsArcade from "./VictorsArcade.js";
import VictorsAuto from "./VictorsAuto.js";
import VictorsDevice from "./VictorsDevice.js";
import VictorsHumanPass from "./VictorsHumanPass.js";
import VictorsMining from "./VictorsMining.js";
import VictorsNft from "./VictorsNft.js";
import VictorsSession from "./VictorsSession.js";
import VictorsState from "./VictorsState.js";
import VictorsTasks from "./VictorsTasks.js";
import VictorsTools from "./VictorsTools.js";
import VictorsWallet from "./VictorsWallet.js";
import VictorsWithdrawal from "./VictorsWithdrawal.js";
import WalletConnectPrompts from "../../lib/farmer/WalletConnectPrompts.js";
import WalletVerifier from "../../lib/farmer/WalletVerifier.js";
import WalletVersion from "../../lib/farmer/WalletVersion.js";
import WithdrawalFlow from "../../lib/farmer/WithdrawalFlow.js";
import WithdrawalQueue, {
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The modules a Victor's Company farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  ctx.state = new VictorsState(deps);
  ctx.api = new VictorsApi(deps);
  ctx.device = new VictorsDevice(deps);
  ctx.session = new VictorsSession(deps);
  ctx.humanPass = new VictorsHumanPass(deps);
  ctx.wallet = new VictorsWallet(deps);
  ctx.mining = new VictorsMining(deps);
  ctx.tasks = new VictorsTasks(deps);
  ctx.arcade = new VictorsArcade(deps);
  ctx.withdrawal = new VictorsWithdrawal(deps);
  ctx.account = new VictorsAccount(deps);
  ctx.auto = new VictorsAuto(deps);
  ctx.nft = new VictorsNft(deps);
  ctx.tools = new VictorsTools(deps);

  ctx.walletVersion = new WalletVersion(() => core.storage);

  ctx.withdrawals = new WithdrawalQueue({
    read: () => ctx.withdrawal.getWithdrawals(),
    classify: statusClassifier({
      pending: PENDING_WITHDRAWAL_STATUSES,
      approved: APPROVED_WITHDRAWAL_STATUSES,
      flagged: FLAGGED_WITHDRAWAL_STATUSES,
    }),
    prepare: () => ctx.state.ensureLoaded(),
  });

  ctx.flow = new WithdrawalFlow({
    core,
    place: (options) => ctx.withdrawal.place(options),
    minimum: () => ctx.withdrawal.getMinimumWithdrawal(),
    logStatus: () => ctx.withdrawal.logStatus(),
  });

  ctx.snapshot = new AutoSnapshot({
    core,
    summary: () => ctx.auto.summary(),
    withdrawals: () => ctx.withdrawals.load(),
  });

  ctx.connector = new AutoWalletConnector({
    connectAddress: (address) => ctx.wallet.connectWalletAddress(address),
    connectSigned: (keyPair, version) =>
      ctx.wallet.connectSignedWallet(keyPair, version),
    rememberVersion: (version) => ctx.walletVersion.remember(version),
    summary: () => ctx.auto.summary(),
    refreshSummary: () => ctx.auto.refreshSummary(),
    ensureLoaded: () => ctx.state.ensureLoaded(),
  });

  ctx.verifier = new WalletVerifier({
    ensureLoaded: () => ctx.state.ensureLoaded(),
    isVerified: () => Boolean(ctx.state.verify()["verified"]),
    hasWallet: () => Boolean(ctx.wallet.getConnectedWalletAddress()),
    connect: (wallet) => ctx.auto.connectWallet(wallet),
    pay: (wallet) => ctx.wallet.verifyWalletIfNeeded(wallet),
    summary: () => ctx.auto.summary(),
    refreshSummary: () => ctx.auto.refreshSummary(),
    notConfirmedMessage: "Not confirmed yet, check again",
  });

  ctx.connectPrompts = new WalletConnectPrompts({
    core,
    connect: (wallet) => ctx.auto.connectWallet(wallet),
    ensureLoaded: () => ctx.state.ensureLoaded(),
    afterConnected: (wallet) => ctx.tools.afterDerivedWalletConnected(wallet),
  });

  return Object.freeze(ctx);
}
