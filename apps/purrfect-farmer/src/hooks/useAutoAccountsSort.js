import { useCallback, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";

import useAutoCloudSnapshotsQuery from "./useAutoCloudSnapshotsQuery";
import { FARMER_STATUS_SEVERITY } from "@/constants/farmerStatus";
import { SORT_KEY, SORT_OPTIONS } from "@/constants/autoAccountsSort";
import { getExchange, getWithdrawals, toFigure } from "@/lib/autoSnapshot";
import { getHelperKind } from "@/components/AutoHelperChooser";
import { useAutoBalancesQueryOptions } from "./useAutoBalancesQuery";

/** The direction each key starts in */
const DEFAULT_DIRECTIONS = new Map(
  SORT_OPTIONS.map((option) => [option.value, option.direction]),
);

const defaultDirection = (key) => DEFAULT_DIRECTIONS.get(key) || "desc";

/** Rank the kinds so they sort like any other number */
const HELPER_RANK = { verified: 3, trusted: 1 };

/** An exchange link ranks below verified but above trusted */
const CONNECTED_RANK = 2;

/** The rank an account sorts by, taking the best of its kind and its exchange link */
const getRank = (account, snapshot) =>
  Math.max(
    HELPER_RANK[getHelperKind(account, snapshot)] || 0,
    getExchange(snapshot) ? CONNECTED_RANK : 0,
  );

/** The pending withdrawals the snapshot carries, null until the drop has reported its queue */
const getPendingCount = (snapshot) => {
  const { known, pending } = getWithdrawals(snapshot);

  return known ? pending.length : null;
};

/** A value per key, null when the account has nothing to sort by yet */
const SORT_VALUES = {
  [SORT_KEY.RANKED]: ({ account, snapshot }) => getRank(account, snapshot),
  [SORT_KEY.STATUS]: ({ row }) => FARMER_STATUS_SEVERITY[row?.status] ?? null,
  [SORT_KEY.LAST_FARMED]: ({ snapshot }) =>
    Number(snapshot?.updatedAt) || null,
  [SORT_KEY.EXCHANGE]: ({ snapshot }) =>
    snapshot ? Number(Boolean(getExchange(snapshot))) : null,
  [SORT_KEY.LEVEL]: ({ snapshot }) =>
    snapshot ? Number(snapshot.level) || 0 : null,
  [SORT_KEY.FREEZE]: ({ snapshot }) =>
    Number(snapshot?.mining?.freezesAt) || null,
  [SORT_KEY.ERRORS]: ({ row }) => (row ? Number(row.errorCount) || 0 : null),
  [SORT_KEY.PENDING_WITHDRAWALS]: ({ snapshot }) =>
    snapshot ? getPendingCount(snapshot) : null,
  [SORT_KEY.MINED]: ({ snapshot }) =>
    snapshot ? toFigure(snapshot.balance).toNumber() : null,
  [SORT_KEY.HOLDING]: ({ snapshot }) =>
    snapshot ? toFigure(snapshot.holding).toNumber() : null,
  [SORT_KEY.TON]: ({ balance }) => balance?.ton?.toNumber() ?? null,
  [SORT_KEY.JETTON]: ({ balance }) => balance?.jetton?.toNumber() ?? null,
};

/** Only the wallet balance keys need the balance queries */
const BALANCE_KEYS = [SORT_KEY.TON, SORT_KEY.JETTON];

/** The balances in account order, keeping identity while nothing changed */
const combineBalances = (results) => results.map((result) => result.data);

/** Order accounts for display only, so the selection is never reset by a refetch */
export default function useAutoAccountsSort(
  accounts,
  { enabled = true, defaultSort = SORT_KEY.NORMAL } = {},
) {
  const [sortKey, setKey] = useState(defaultSort);
  const [direction, setDirection] = useState(defaultDirection(defaultSort));

  const { data: snapshots } = useAutoCloudSnapshotsQuery();
  const balancesOptions = useAutoBalancesQueryOptions();

  /** Read the same cache the rows fill, and only while a balance key is picked */
  const needsBalances = enabled && BALANCE_KEYS.includes(sortKey);
  const balances = useQueries({
    queries: needsBalances
      ? accounts.map((account) => balancesOptions(account.address))
      : [],
    combine: combineBalances,
  });

  const setSortKey = useCallback((key) => {
    setKey(key);
    setDirection(defaultDirection(key));
  }, []);

  const toggleDirection = useCallback(() => {
    setDirection((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const sortedAccounts = useMemo(() => {
    if (!enabled) return accounts;

    const getValue = SORT_VALUES[sortKey];

    if (!getValue) {
      return direction === "asc" ? accounts : accounts.toReversed();
    }

    const sign = direction === "asc" ? 1 : -1;

    return accounts
      .map((account, index) => {
        const row = snapshots?.get(String(account.userId)) || null;
        const value = getValue({
          account,
          row,
          snapshot: row?.snapshot || null,
          balance: balances[index],
        });

        return { account, value };
      })
      .toSorted((a, b) => {
        /** Missing values sit last whichever way the list runs */
        if (a.value === null || b.value === null) {
          return (a.value === null) - (b.value === null);
        }

        return (a.value - b.value) * sign;
      })
      .map((item) => item.account);
  }, [accounts, snapshots, balances, enabled, sortKey, direction]);

  return { sortedAccounts, sortKey, setSortKey, direction, toggleDirection };
}
