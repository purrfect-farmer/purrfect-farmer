import WithdrawalQueue, {
  WITHDRAWAL_CATEGORY,
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The collaborators an ATF farmer works through, as `farmer.ctx` */
export function createContext(farmer) {
  return {
    /** Anything neither pending nor approved counts as flagged */
    withdrawals: new WithdrawalQueue({
      read: async () => (await farmer.getWithdrawHistory())?.items || [],
      classify: statusClassifier({
        pending: ["pending"],
        approved: ["approved"],
        otherwise: WITHDRAWAL_CATEGORY.FLAGGED,
      }),
    }),
  };
}
