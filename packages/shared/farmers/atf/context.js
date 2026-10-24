import ATFAccount from "./ATFAccount.js";
import ATFActivity from "./ATFActivity.js";
import ATFApi from "./ATFApi.js";
import ATFAuto from "./ATFAuto.js";
import ATFMining from "./ATFMining.js";
import ATFSession from "./ATFSession.js";
import ATFState from "./ATFState.js";
import ATFTasks from "./ATFTasks.js";
import ATFTools from "./ATFTools.js";
import ATFWallet from "./ATFWallet.js";
import ATFWithdrawal from "./ATFWithdrawal.js";
import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import WalletConnectPrompts from "../../lib/farmer/WalletConnectPrompts.js";
import WalletVersion from "../../lib/farmer/WalletVersion.js";
import WithdrawalFlow from "../../lib/farmer/WithdrawalFlow.js";
import WithdrawalQueue, {
  WITHDRAWAL_CATEGORY,
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The modules an ATF farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  ctx.state = new ATFState(deps);
  ctx.api = new ATFApi(deps);
  ctx.session = new ATFSession(deps);
  ctx.activity = new ATFActivity(deps);
  ctx.wallet = new ATFWallet(deps);
  ctx.withdrawal = new ATFWithdrawal(deps);
  ctx.mining = new ATFMining(deps);
  ctx.tasks = new ATFTasks(deps);
  ctx.account = new ATFAccount(deps);
  ctx.auto = new ATFAuto(deps);
  ctx.tools = new ATFTools(deps);

  ctx.walletVersion = new WalletVersion(() => core.storage);

  /** Anything neither pending nor approved counts as flagged */
  ctx.withdrawals = new WithdrawalQueue({
    read: async () => (await ctx.api.getWithdrawHistory())?.items || [],
    classify: statusClassifier({
      pending: ["pending"],
      approved: ["approved"],
      otherwise: WITHDRAWAL_CATEGORY.FLAGGED,
    }),
  });

  ctx.flow = new WithdrawalFlow({
    core,
    place: (options) => ctx.withdrawal.place(options),
  });

  ctx.snapshot = new AutoSnapshot({
    core,
    summary: () => ctx.auto.summary(),
    withdrawals: () => ctx.withdrawals.load(),
  });

  ctx.connectPrompts = new WalletConnectPrompts({
    core,
    connect: (wallet) => ctx.auto.connectWallet(wallet),
  });

  return Object.freeze(ctx);
}
