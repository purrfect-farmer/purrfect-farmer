import AdClients from "../../lib/farmer/AdClients.js";
import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "../../lib/farmer/AutoWalletConnector.js";
import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  PENDING_WITHDRAWAL_STATUSES,
} from "./constants.js";
import DiggoAccount from "./DiggoAccount.js";
import DiggoActivation from "./DiggoActivation.js";
import DiggoApi from "./DiggoApi.js";
import DiggoAuto from "./DiggoAuto.js";
import DiggoBrowser from "./DiggoBrowser.js";
import DiggoMarket from "./DiggoMarket.js";
import DiggoRiskChallenge from "./DiggoRiskChallenge.js";
import DiggoSession from "./DiggoSession.js";
import DiggoState from "./DiggoState.js";
import DiggoTasks from "./DiggoTasks.js";
import DiggoTools from "./DiggoTools.js";
import DiggoWallet from "./DiggoWallet.js";
import DiggoWithdrawal from "./DiggoWithdrawal.js";
import WalletConnectPrompts from "../../lib/farmer/WalletConnectPrompts.js";
import WalletVersion from "../../lib/farmer/WalletVersion.js";
import WithdrawalFlow from "../../lib/farmer/WithdrawalFlow.js";
import WithdrawalQueue, {
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The modules a Diggo farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  ctx.state = new DiggoState(deps);
  ctx.api = new DiggoApi(deps);
  ctx.browser = new DiggoBrowser(deps);
  ctx.session = new DiggoSession(deps);
  ctx.risk = new DiggoRiskChallenge(deps);
  ctx.tasks = new DiggoTasks(deps);
  ctx.wallet = new DiggoWallet(deps);
  ctx.activation = new DiggoActivation(deps);
  ctx.withdrawal = new DiggoWithdrawal(deps);
  ctx.market = new DiggoMarket(deps);
  ctx.account = new DiggoAccount(deps);
  ctx.auto = new DiggoAuto(deps);
  ctx.tools = new DiggoTools(deps);

  /** The AdsGram client the ad task is watched with */
  ctx.ads = new AdClients(() => core.adClientOptions());

  ctx.walletVersion = new WalletVersion(() => core.storage);

  ctx.withdrawals = new WithdrawalQueue({
    read: () => ctx.withdrawal.getWithdrawals(),
    classify: statusClassifier({
      pending: PENDING_WITHDRAWAL_STATUSES,
      approved: APPROVED_WITHDRAWAL_STATUSES,
      flagged: FLAGGED_WITHDRAWAL_STATUSES,
    }),
    prepare: () => ctx.state.ensureLoaded(),
    /** The withdrawal status names a request still in flight */
    hasActive: async () =>
      Boolean((await ctx.withdrawal.getWithdrawalStatus())["activeWithdrawal"]),
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

  ctx.connectPrompts = new WalletConnectPrompts({
    core,
    connect: (wallet) => ctx.auto.connectWallet(wallet),
    ensureLoaded: () => ctx.state.ensureLoaded(),
  });

  return Object.freeze(ctx);
}
