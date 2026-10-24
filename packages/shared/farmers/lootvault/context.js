import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "../../lib/farmer/AutoWalletConnector.js";
import LootVaultAccount from "./LootVaultAccount.js";
import LootVaultApi from "./LootVaultApi.js";
import LootVaultAuto from "./LootVaultAuto.js";
import LootVaultCaptcha from "./LootVaultCaptcha.js";
import LootVaultMining from "./LootVaultMining.js";
import LootVaultSession from "./LootVaultSession.js";
import LootVaultState from "./LootVaultState.js";
import LootVaultTasks from "./LootVaultTasks.js";
import LootVaultTools from "./LootVaultTools.js";
import LootVaultTower from "./LootVaultTower.js";
import LootVaultWallet from "./LootVaultWallet.js";
import LootVaultWithdrawal from "./LootVaultWithdrawal.js";
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

/** The modules a LootVault farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  ctx.state = new LootVaultState(deps);
  ctx.api = new LootVaultApi(deps);
  ctx.captcha = new LootVaultCaptcha(deps);
  ctx.session = new LootVaultSession(deps);
  ctx.wallet = new LootVaultWallet(deps);
  ctx.mining = new LootVaultMining(deps);
  ctx.tasks = new LootVaultTasks(deps);
  ctx.tower = new LootVaultTower(deps);
  ctx.withdrawal = new LootVaultWithdrawal(deps);
  ctx.account = new LootVaultAccount(deps);
  ctx.auto = new LootVaultAuto(deps);
  ctx.tools = new LootVaultTools(deps);

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
