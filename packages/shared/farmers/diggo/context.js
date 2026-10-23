import AdClients from "../../lib/farmer/AdClients.js";
import {
  APPROVED_WITHDRAWAL_STATUSES,
  FLAGGED_WITHDRAWAL_STATUSES,
  PENDING_WITHDRAWAL_STATUSES,
} from "./constants.js";
import WithdrawalQueue, {
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The collaborators a Diggo farmer works through, as `farmer.ctx` */
export function createContext(farmer) {
  return {
    /** The AdsGram client the ad task is watched with */
    ads: new AdClients(() => farmer.getAdClientOptions()),
    withdrawals: new WithdrawalQueue({
      read: () => farmer.getWithdrawals(),
      classify: statusClassifier({
        pending: PENDING_WITHDRAWAL_STATUSES,
        approved: APPROVED_WITHDRAWAL_STATUSES,
        flagged: FLAGGED_WITHDRAWAL_STATUSES,
      }),
      prepare: () => farmer.ensureStateLoaded(),
      /** The withdrawal status names a request still in flight */
      hasActive: async () =>
        Boolean((await farmer.getWithdrawalStatus())["activeWithdrawal"]),
    }),
  };
}
