import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "../../lib/farmer/AutoWalletConnector.js";
import PickaxeAccount from "./PickaxeAccount.js";
import PickaxeApi from "./PickaxeApi.js";
import PickaxeAuto from "./PickaxeAuto.js";
import PickaxeMining from "./PickaxeMining.js";
import PickaxePass from "./PickaxePass.js";
import PickaxeSession from "./PickaxeSession.js";
import PickaxeState from "./PickaxeState.js";
import PickaxeTasks from "./PickaxeTasks.js";
import PickaxeTools from "./PickaxeTools.js";
import PickaxeWallet from "./PickaxeWallet.js";
import PickaxeWithdrawal from "./PickaxeWithdrawal.js";
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

/** The modules a Pickaxe Empire farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  ctx.state = new PickaxeState(deps);
  ctx.api = new PickaxeApi(deps);
  ctx.session = new PickaxeSession(deps);
  ctx.wallet = new PickaxeWallet(deps);
  ctx.pass = new PickaxePass(deps);
  ctx.mining = new PickaxeMining(deps);
  ctx.tasks = new PickaxeTasks(deps);
  ctx.withdrawal = new PickaxeWithdrawal(deps);
  ctx.account = new PickaxeAccount(deps);
  ctx.auto = new PickaxeAuto(deps);
  ctx.tools = new PickaxeTools(deps);

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
