import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "../../lib/farmer/AutoWalletConnector.js";
import MRGAccount from "./MRGAccount.js";
import MRGApi from "./MRGApi.js";
import MRGAuto from "./MRGAuto.js";
import MRGDevice from "./MRGDevice.js";
import MRGHumanCheck from "./MRGHumanCheck.js";
import MRGMining from "./MRGMining.js";
import MRGNft from "./MRGNft.js";
import MRGSession from "./MRGSession.js";
import MRGState from "./MRGState.js";
import MRGTasks from "./MRGTasks.js";
import MRGTools from "./MRGTools.js";
import MRGWallet from "./MRGWallet.js";
import MRGWithdrawal from "./MRGWithdrawal.js";
import WalletConnectPrompts from "../../lib/farmer/WalletConnectPrompts.js";
import WalletVerifier from "../../lib/farmer/WalletVerifier.js";
import WalletVersion from "../../lib/farmer/WalletVersion.js";
import WithdrawalFlow from "../../lib/farmer/WithdrawalFlow.js";
import WithdrawalQueue, {
  WITHDRAWAL_CATEGORY,
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The modules an MRG farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  ctx.state = new MRGState(deps);
  ctx.api = new MRGApi(deps);
  ctx.device = new MRGDevice(deps);
  ctx.session = new MRGSession(deps);
  ctx.humanCheck = new MRGHumanCheck(deps);
  ctx.wallet = new MRGWallet(deps);
  ctx.nft = new MRGNft(deps);
  ctx.mining = new MRGMining(deps);
  ctx.tasks = new MRGTasks(deps);
  ctx.withdrawal = new MRGWithdrawal(deps);
  ctx.account = new MRGAccount(deps);
  ctx.auto = new MRGAuto(deps);
  ctx.tools = new MRGTools(deps);

  ctx.walletVersion = new WalletVersion(() => core.storage);

  /** This drop never flags a payout and never counts one as approved */
  ctx.withdrawals = new WithdrawalQueue({
    read: () => ctx.withdrawal.getWithdrawals(),
    classify: statusClassifier({
      pending: ["pending", "processing"],
      normalize: (status) => String(status || "").toLowerCase(),
    }),
    categories: [WITHDRAWAL_CATEGORY.PENDING, WITHDRAWAL_CATEGORY.FLAGGED],
    prepare: () => ctx.state.ensureLoaded(),
  });

  ctx.flow = new WithdrawalFlow({
    core,
    place: (options) => ctx.withdrawal.place(options),
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
    isVerified: () => ctx.account.isAccountVerified(ctx.state.user()),
    hasWallet: () => Boolean(ctx.wallet.getConnectedWalletAddress()),
    connect: (wallet) => ctx.auto.connectWallet(wallet),
    pay: (wallet) => ctx.wallet.verifyWalletIfNeeded(wallet),
    summary: () => ctx.auto.summary(),
    refreshSummary: () => ctx.auto.refreshSummary(),
  });

  ctx.connectPrompts = new WalletConnectPrompts({
    core,
    connect: (wallet) => ctx.auto.connectWallet(wallet),
    ensureLoaded: () => ctx.state.ensureLoaded(),
    afterConnected: (wallet) => ctx.tools.afterDerivedWalletConnected(wallet),
  });

  return Object.freeze(ctx);
}
