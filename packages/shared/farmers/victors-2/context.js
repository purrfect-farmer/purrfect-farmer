import AdClients from "../../lib/farmer/AdClients.js";
import AutoSnapshot from "../../lib/farmer/AutoSnapshot.js";
import AutoWalletConnector from "../../lib/farmer/AutoWalletConnector.js";
import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  PENDING_WITHDRAWAL_STATUSES,
} from "./constants.js";
import Victors2Account from "./Victors2Account.js";
import Victors2Ads from "./Victors2Ads.js";
import Victors2Api from "./Victors2Api.js";
import Victors2Arcade from "./Victors2Arcade.js";
import Victors2Auto from "./Victors2Auto.js";
import Victors2Device from "./Victors2Device.js";
import Victors2Gifts from "./Victors2Gifts.js";
import Victors2HumanPass from "./Victors2HumanPass.js";
import Victors2Mining from "./Victors2Mining.js";
import Victors2Nft from "./Victors2Nft.js";
import Victors2Pass from "./Victors2Pass.js";
import Victors2Session from "./Victors2Session.js";
import Victors2State from "./Victors2State.js";
import Victors2Tasks from "./Victors2Tasks.js";
import Victors2Tools from "./Victors2Tools.js";
import Victors2Wallet from "./Victors2Wallet.js";
import Victors2Withdrawal from "./Victors2Withdrawal.js";
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

  ctx.state = new Victors2State(deps);
  ctx.api = new Victors2Api(deps);
  ctx.device = new Victors2Device(deps);
  ctx.session = new Victors2Session(deps);
  ctx.humanPass = new Victors2HumanPass(deps);
  ctx.wallet = new Victors2Wallet(deps);
  ctx.pass = new Victors2Pass(deps);
  ctx.mining = new Victors2Mining(deps);
  ctx.tasks = new Victors2Tasks(deps);
  ctx.adWatcher = new Victors2Ads(deps);
  ctx.gifts = new Victors2Gifts(deps);
  ctx.arcade = new Victors2Arcade(deps);
  ctx.withdrawal = new Victors2Withdrawal(deps);
  ctx.account = new Victors2Account(deps);
  ctx.auto = new Victors2Auto(deps);
  ctx.nft = new Victors2Nft(deps);
  ctx.tools = new Victors2Tools(deps);

  ctx.walletVersion = new WalletVersion(() => core.storage);

  ctx.ads = new AdClients(() => core.adClientOptions());

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
    isVerified: () => ctx.state.isPassActive(),
    hasWallet: () => Boolean(ctx.wallet.getConnectedWalletAddress()),
    connect: (wallet) => ctx.auto.connectWallet(wallet),
    pay: (wallet) => ctx.pass.pay(wallet),
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
