import WithdrawalQueue, {
  WITHDRAWAL_CATEGORY,
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The collaborators an MRG farmer works through, as `farmer.ctx` */
export function createContext(farmer) {
  return {
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
