import { TURNSTILE_PAGE_URL, TURNSTILE_SITE_KEY } from "./constants.js";
import TurnstileGate from "../../lib/farmer/TurnstileGate.js";
import WithdrawalQueue, {
  WITHDRAWAL_CATEGORY,
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The collaborators an MRG farmer works through, as `farmer.ctx` */
export function createContext(farmer) {
  return {
    humanCheck: new TurnstileGate({
      siteKey: TURNSTILE_SITE_KEY,
      pageUrl: TURNSTILE_PAGE_URL,
      canSolve: () => farmer.canSolveTurnstile(),
      solveTurnstile: (params) => farmer.solveTurnstile(params),
      submit: (token) => farmer.submitHumanCheck(token),
      logger: () => farmer.logger,
    }),
    /** This drop never flags a payout and never counts one as approved */
    withdrawals: new WithdrawalQueue({
      read: () => farmer.getWithdrawals(),
      classify: statusClassifier({
        pending: ["pending", "processing"],
        normalize: (status) => String(status || "").toLowerCase(),
      }),
      categories: [WITHDRAWAL_CATEGORY.PENDING, WITHDRAWAL_CATEGORY.FLAGGED],
      prepare: () => farmer.ensureStateLoaded(),
    }),
  };
}
