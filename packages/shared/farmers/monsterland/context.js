import AdClients from "../../lib/farmer/AdClients.js";
import TurnstileGate from "../../lib/farmer/TurnstileGate.js";
import {
  FLAGGED_WITHDRAWAL_STATUSES,
  SETTLED_WITHDRAWAL_STATUSES,
  TURNSTILE_PAGE_URL,
  TURNSTILE_SITE_KEY,
  GIGAPUB_PROJECT_ID,
  MONETAG_ZONE_ID,
  TADS_WIDGET_ID,
} from "./constants.js";
import WithdrawalQueue, {
  WITHDRAWAL_CATEGORY,
  statusClassifier,
} from "../../lib/farmer/WithdrawalQueue.js";

/** The collaborators a Monsterland farmer works through, as `farmer.ctx` */
export function createContext(farmer) {
  return {
    /** The page's ad networks, each created once per run */
    ads: new AdClients(() => farmer.getAdClientOptions(), {
      monetag: { zoneId: MONETAG_ZONE_ID },
      gigapub: { projectId: GIGAPUB_PROJECT_ID },
      tads: { widgetId: TADS_WIDGET_ID },
    }),
    humanCheck: new TurnstileGate({
      siteKey: TURNSTILE_SITE_KEY,
      pageUrl: TURNSTILE_PAGE_URL,
      canSolve: () => farmer.canSolveTurnstile(),
      solveTurnstile: (params) => farmer.solveTurnstile(params),
      submit: (token) => farmer.submitHumanCheck(token),
      logger: () => farmer.logger,
      beforeSolve: () => farmer.logPreviousPassLifespan(),
    }),
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
