import TurnstileGate from "../../lib/farmer/TurnstileGate.js";
import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  PENDING_WITHDRAWAL_STATUSES,
  TURNSTILE_PAGE_URL,
  TURNSTILE_SITE_KEY,
} from "./constants.js";
import WithdrawalQueue, {
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The collaborators a Victor's Company farmer works through, as `farmer.ctx` */
export function createContext(farmer) {
  return {
    humanCheck: new TurnstileGate({
      siteKey: TURNSTILE_SITE_KEY,
      pageUrl: TURNSTILE_PAGE_URL,
      canSolve: () => farmer.canSolveTurnstile(),
      solveTurnstile: (params) => farmer.solveTurnstile(params),
      submit: (token) => farmer.submitHumanPass(token),
      logger: () => farmer.logger,
      /** A new attempt drops the old pass first */
      onStart: () => {
        farmer.humanPass = null;
      },
    }),
    withdrawals: new WithdrawalQueue({
      read: () => farmer.getWithdrawals(),
      classify: statusClassifier({
        pending: PENDING_WITHDRAWAL_STATUSES,
        approved: APPROVED_WITHDRAWAL_STATUSES,
        flagged: FLAGGED_WITHDRAWAL_STATUSES,
      }),
      prepare: () => farmer.ensureStateLoaded(),
    }),
  };
}
