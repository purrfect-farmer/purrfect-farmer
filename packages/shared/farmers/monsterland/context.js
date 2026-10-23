import {
  FLAGGED_WITHDRAWAL_STATUSES,
  SETTLED_WITHDRAWAL_STATUSES,
} from "./constants.js";
import WithdrawalQueue, {
  WITHDRAWAL_CATEGORY,
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The collaborators a Monsterland farmer works through, as `farmer.ctx` */
export function createContext(farmer) {
  return {
    /** Anything not settled or refused is still in flight, `processing` and `pending_approval` included */
    withdrawals: new WithdrawalQueue({
      read: () => farmer.getWithdrawals(),
      classify: statusClassifier({
        approved: SETTLED_WITHDRAWAL_STATUSES,
        flagged: FLAGGED_WITHDRAWAL_STATUSES,
        otherwise: WITHDRAWAL_CATEGORY.PENDING,
      }),
    }),
  };
}
