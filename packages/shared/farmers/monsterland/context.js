import AdClients from "../../lib/farmer/AdClients.js";
import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "../../lib/farmer/AutoWalletConnector.js";
import {
  ADEXIUM_WIDGET_ID,
  FLAGGED_WITHDRAWAL_STATUSES,
  GIGAPUB_PROJECT_ID,
  MONETAG_ZONE_ID,
  SETTLED_WITHDRAWAL_STATUSES,
  TADS_WIDGET_ID,
} from "./constants.js";
import MonsterlandAccount from "./MonsterlandAccount.js";
import MonsterlandAds from "./MonsterlandAds.js";
import MonsterlandApi from "./MonsterlandApi.js";
import MonsterlandAuto from "./MonsterlandAuto.js";
import MonsterlandCare from "./MonsterlandCare.js";
import MonsterlandEggs from "./MonsterlandEggs.js";
import MonsterlandGrowth from "./MonsterlandGrowth.js";
import MonsterlandHumanCheck from "./MonsterlandHumanCheck.js";
import MonsterlandRewards from "./MonsterlandRewards.js";
import MonsterlandSession from "./MonsterlandSession.js";
import MonsterlandState from "./MonsterlandState.js";
import MonsterlandTools from "./MonsterlandTools.js";
import MonsterlandWallet from "./MonsterlandWallet.js";
import MonsterlandWithdrawal from "./MonsterlandWithdrawal.js";
import WalletConnectPrompts from "../../lib/farmer/WalletConnectPrompts.js";
import WalletVersion from "../../lib/farmer/WalletVersion.js";
import WithdrawalFlow from "../../lib/farmer/WithdrawalFlow.js";
import WithdrawalQueue, {
  WITHDRAWAL_CATEGORY,
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The modules a Monsterland farmer works through, as `farmer.ctx` */
export function createContext(core) {
  const ctx = {};
  const deps = { core, ctx };

  ctx.state = new MonsterlandState(deps);
  ctx.api = new MonsterlandApi(deps);
  ctx.humanCheck = new MonsterlandHumanCheck(deps);
  ctx.session = new MonsterlandSession(deps);
  ctx.adWatcher = new MonsterlandAds(deps);
  ctx.rewards = new MonsterlandRewards(deps);
  ctx.eggs = new MonsterlandEggs(deps);
  ctx.care = new MonsterlandCare(deps);
  ctx.growth = new MonsterlandGrowth(deps);
  ctx.withdrawal = new MonsterlandWithdrawal(deps);
  ctx.wallet = new MonsterlandWallet(deps);
  ctx.account = new MonsterlandAccount(deps);
  ctx.auto = new MonsterlandAuto(deps);
  ctx.tools = new MonsterlandTools(deps);

  /** The page's ad networks, each created once per run */
  ctx.ads = new AdClients(() => core.adClientOptions(), {
    monetag: { zoneId: MONETAG_ZONE_ID },
    gigapub: { projectId: GIGAPUB_PROJECT_ID },
    tads: { widgetId: TADS_WIDGET_ID },
    adexium: { wid: ADEXIUM_WIDGET_ID },
  });

  ctx.walletVersion = new WalletVersion(() => core.storage);

  /** Anything not settled or refused is still in flight, `processing` and `pending_approval` included */
  ctx.withdrawals = new WithdrawalQueue({
    read: () => ctx.withdrawal.getWithdrawals(),
    classify: statusClassifier({
      approved: SETTLED_WITHDRAWAL_STATUSES,
      flagged: FLAGGED_WITHDRAWAL_STATUSES,
      otherwise: WITHDRAWAL_CATEGORY.PENDING,
    }),
  });

  ctx.flow = new WithdrawalFlow({
    core,
    place: (options) => ctx.withdrawal.place(options),
    minimum: () => ctx.withdrawal.getMinimumWithdrawal(),
  });

  ctx.snapshot = new AutoSnapshot({
    core,
    summary: () => ctx.auto.summary(),
    withdrawals: () => ctx.withdrawals.load(),
  });

  ctx.connector = new AutoWalletConnector({
    connectAddress: (address) => ctx.wallet.connectWalletAddress(address),
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
