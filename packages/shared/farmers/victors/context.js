import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  PENDING_WITHDRAWAL_STATUSES,
} from "./constants.js";
import WithdrawalQueue, {
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The collaborators a Victor's Company farmer works through, as `farmer.ctx` */
export function createContext(farmer) {
  return {
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
