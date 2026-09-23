import { useCallback, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";

import useAutoCloudSnapshotsQuery from "./useAutoCloudSnapshotsQuery";
import { getHelperKind } from "@/components/AutoHelperChooser";
import { toFigure } from "@/lib/autoSnapshot";
import { useAutoBalancesQueryOptions } from "./useAutoBalancesQuery";

export const SORT_OPTIONS = [
  { value: "normal", label: "Normal" },
  { value: "ranked", label: "Verified > Trusted > Others" },
  { value: "mined", label: "Mined balance" },
  { value: "holding", label: "Holding" },
  { value: "ton", label: "TON balance" },
  { value: "jetton", label: "Jetton balance" },
];

/** Stored order reads naturally first, every other key reads highest first */
const defaultDirection = (key) => (key === "normal" ? "asc" : "desc");

/** Rank the kinds so they sort like any other number */
const HELPER_RANK = { verified: 2, trusted: 1 };

/** Only the wallet balance keys need the balance queries */
const BALANCE_KEYS = ["ton", "jetton"];

/** The balances in account order, keeping identity while nothing changed */
const combineBalances = (results) => results.map((result) => result.data);

/** Order accounts for display only, so the selection is never reset by a refetch */
export default function useAutoAccountsSort(
  accounts,
  { enabled = true, defaultSort = "normal" } = {},
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

    if (sortKey === "normal") {
      return direction === "asc" ? accounts : accounts.toReversed();
    }

    /** A value per account, null when it has nothing to sort by yet */
    const getValue = (account, index) => {
      const snapshot = snapshots?.get(String(account.userId))?.snapshot;

      switch (sortKey) {
        case "ranked":
          return HELPER_RANK[getHelperKind(account, snapshot)] || 0;
        case "mined":
          return snapshot ? toFigure(snapshot.balance).toNumber() : null;
        case "holding":
          return snapshot ? toFigure(snapshot.holding).toNumber() : null;
        case "ton":
          return balances[index]?.ton?.toNumber() ?? null;
        case "jetton":
          return balances[index]?.jetton?.toNumber() ?? null;
        default:
          return null;
      }
    };

    const sign = direction === "asc" ? 1 : -1;

    return accounts
      .map((account, index) => ({ account, value: getValue(account, index) }))
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
