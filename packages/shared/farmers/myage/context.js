import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "../../lib/farmer/AutoWalletConnector.js";
import MyAgeAccount from "./MyAgeAccount.js";
import MyAgeApi from "./MyAgeApi.js";
import MyAgeAuto from "./MyAgeAuto.js";
import MyAgeProfile from "./MyAgeProfile.js";
import MyAgeRewards from "./MyAgeRewards.js";
import MyAgeSession from "./MyAgeSession.js";
import MyAgeState from "./MyAgeState.js";
import MyAgeTasks from "./MyAgeTasks.js";
import MyAgeTools from "./MyAgeTools.js";
import MyAgeWallet from "./MyAgeWallet.js";
import MyAgeWithdrawal from "./MyAgeWithdrawal.js";
import WalletConnectPrompts from "../../lib/farmer/WalletConnectPrompts.js";
import WalletVersion from "../../lib/farmer/WalletVersion.js";
import WithdrawalFlow from "../../lib/farmer/WithdrawalFlow.js";
import WithdrawalQueue, {
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";
import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  PENDING_WITHDRAWAL_STATUSES,
} from "./constants.js";

/** The modules a My Age farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  /* The drop's own modules */
  ctx.state = new MyAgeState(deps);
  ctx.api = new MyAgeApi(deps);
  ctx.session = new MyAgeSession(deps);
  ctx.wallet = new MyAgeWallet(deps);
  ctx.rewards = new MyAgeRewards(deps);
  ctx.tasks = new MyAgeTasks(deps);
  ctx.profile = new MyAgeProfile(deps);
  ctx.withdrawal = new MyAgeWithdrawal(deps);
  ctx.account = new MyAgeAccount(deps);
  ctx.auto = new MyAgeAuto(deps);
  ctx.tools = new MyAgeTools(deps);

  /* The shared Auto collaborators */
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

  ctx.connectPrompts = new WalletConnectPrompts({
    core,
    connect: (wallet) => ctx.auto.connectWallet(wallet),
    ensureLoaded: () => ctx.state.ensureLoaded(),
  });

  return Object.freeze(ctx);
}
