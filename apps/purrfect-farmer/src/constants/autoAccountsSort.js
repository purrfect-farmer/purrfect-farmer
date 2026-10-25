/** The keys the Auto accounts list can be ordered by */
export const SORT_KEY = Object.freeze({
  NORMAL: "normal",
  RANKED: "ranked",
  STATUS: "status",
  LAST_FARMED: "last-farmed",
  EXCHANGE: "exchange",
  LEVEL: "level",
  FREEZE: "freeze",
  ERRORS: "errors",
  PENDING_WITHDRAWALS: "pending-withdrawals",
  MINED: "mined",
  HOLDING: "holding",
  TON: "ton",
  JETTON: "jetton",
  CLOUD_WALLET: "cloud-wallet",
});

/** Each key with its label and the direction it starts in */
export const SORT_OPTIONS = [
  { value: SORT_KEY.NORMAL, label: "Normal", direction: "asc" },
  {
    value: SORT_KEY.RANKED,
    label: "Verified > Connected > Trusted > Others",
    direction: "desc",
  },
  {
    value: SORT_KEY.STATUS,
    label: "Status (problems first)",
    direction: "desc",
  },
  {
    value: SORT_KEY.LAST_FARMED,
    label: "Last farmed (oldest first)",
    direction: "asc",
  },
  { value: SORT_KEY.EXCHANGE, label: "Exchange connected", direction: "desc" },
  { value: SORT_KEY.LEVEL, label: "Miner level", direction: "desc" },
  {
    value: SORT_KEY.FREEZE,
    label: "Mining freeze (soonest first)",
    direction: "asc",
  },
  { value: SORT_KEY.ERRORS, label: "Errors", direction: "desc" },
  {
    value: SORT_KEY.PENDING_WITHDRAWALS,
    label: "Pending withdrawals",
    direction: "desc",
  },
  { value: SORT_KEY.MINED, label: "Mined balance", direction: "desc" },
  { value: SORT_KEY.HOLDING, label: "Holding", direction: "desc" },
  { value: SORT_KEY.TON, label: "TON balance", direction: "desc" },
  { value: SORT_KEY.JETTON, label: "Jetton balance", direction: "desc" },
  {
    value: SORT_KEY.CLOUD_WALLET,
    label: "Cloud wallet (not pushed first)",
    direction: "asc",
  },
];
