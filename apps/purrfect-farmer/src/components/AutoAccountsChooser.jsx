import {
  MdCancel,
  MdCheckCircle,
  MdInfo,
  MdRemoveCircle,
} from "react-icons/md";
import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";

import AutoAccountBalance from "./AutoAccountBalance";
import AutoAccountDetailsDialog from "./AutoAccountDetailsDialog";
import AutoAccountFlags from "./AutoAccountFlags";
import AutoAccountLaunchButton from "./AutoAccountLaunchButton";
import AutoAccountSnapshot from "./AutoAccountSnapshot";
import AutoAccountsSortControls from "./AutoAccountsSortControls";
import AutoAddress from "./AutoAddress";
import AutoDropVerifiedBadge from "./AutoDropVerifiedBadge";
import AutoAvatar from "./AutoAvatar";
import AutoVerifiedBadge from "./AutoVerifiedBadge";
import AutoVersionBadge from "./AutoVersionBadge";
import { Dialog } from "radix-ui";
import { Virtuoso } from "react-virtuoso";
import FarmerStatusDot from "./FarmerStatusDot";
import Input from "./Input";
import { cn } from "@/utils";
import { searchAutoAccount } from "@purrfect/shared/lib/auto/wallet";
import useAutoAccountsSort from "@/hooks/useAutoAccountsSort";
import { useAutoCloudSnapshot } from "@/hooks/useAutoCloudSnapshotsQuery";

function getInitials(title) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
}

/** Nearest ancestor that scrolls vertically */
function getScrollParent(element) {
  for (let el = element?.parentElement; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if (overflowY === "auto" || overflowY === "scroll") return el;
  }
  return document.scrollingElement;
}

function truncateAddress(address) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const ResultIcon = ({ result }) => {
  if (!result) {
    return <MdInfo className="size-4 text-neutral-400 shrink-0" />;
  }
  if (result.status) {
    return <MdCheckCircle className="size-4 text-green-500 shrink-0" />;
  }
  if (result.skipped) {
    return <MdRemoveCircle className="size-4 text-yellow-500 shrink-0" />;
  }
  return <MdCancel className="size-4 text-red-500 shrink-0" />;
};

const AccountChooserItem = memo(function AccountChooserItem({
  account,
  checked,
  disabled,
  result,
  showBalance,
  toggleAccount,
}) {
  const initials = useMemo(() => getInitials(account.title), [account.title]);
  const hasResult = typeof result !== "undefined";
  const [detailsOpen, setDetailsOpen] = useState(false);

  /** Only meaningful for an account this drop already farms */
  const { row } = useAutoCloudSnapshot(showBalance ? account.userId : null);

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
        disabled && "opacity-60",
      )}
    >
      <label className="flex items-center gap-2 grow min-w-0 cursor-pointer">
        {/* Result icon or Checkbox */}
        {hasResult ? (
          <ResultIcon result={result} />
        ) : (
          <input
            type="checkbox"
            checked={checked}
            disabled={disabled}
            onChange={(e) => toggleAccount(account, e.target.checked)}
            className="size-4 shrink-0 accent-orange-500"
          />
        )}

        {/* Avatar */}
        <AutoAvatar account={account} className="size-8" />

        {/* Info */}
        <div className="flex flex-col grow min-w-0">
          <div className="flex flex-wrap items-center">
            {/* Title */}
            <h3 className="font-bold truncate w-full grow min-w-0">
              {account.title}
            </h3>
            {/* Address */}
            <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-100">
              <AutoAddress address={account.address} />
              <AutoVersionBadge version={account.version} />
              <AutoVerifiedBadge verified={account.verified} />
              {showBalance ? <AutoDropVerifiedBadge account={account} /> : null}
              <FarmerStatusDot status={row?.status} />
            </div>
          </div>
          {showBalance ? (
            <>
              <AutoAccountBalance account={account} />

              {/* What the drop last said about it */}
              <AutoAccountSnapshot account={account} />

              {/* Why a run would skip it */}
              <AutoAccountFlags account={account} />
            </>
          ) : null}
        </div>
      </label>

      {/* Launch and details, outside the label so the click does not toggle the account */}
      <AutoAccountLaunchButton account={account} />

      {/* Details */}
      {showBalance ? (
        <Dialog.Root open={detailsOpen} onOpenChange={setDetailsOpen}>
          <Dialog.Trigger
            className={cn(
              "text-neutral-500 dark:text-neutral-400",
              "hover:bg-neutral-300 dark:hover:bg-neutral-500",
              "hover:text-black dark:hover:text-white",
              "p-1.5 rounded-lg shrink-0",
              "cursor-pointer transition-colors",
            )}
          >
            <MdInfo className="size-5" />
          </Dialog.Trigger>
          <AutoAccountDetailsDialog account={account} />
        </Dialog.Root>
      ) : null}
    </div>
  );
});

/**
 * @param {boolean} [props.showBalance] - false for accounts not in this drop yet, whose balance and snapshot would belong to another drop
 * @param {boolean} [props.autoFocusSearch] - false when another chooser or field should hold focus first
 * @param {string} [props.defaultSort] - the order to start in, one of the SORT_OPTIONS values
 */
export default function AutoAccountsChooser({
  accounts,
  disabled,
  allSelected,
  selectedAccounts,
  results,
  showBalance = true,
  autoFocusSearch = true,
  defaultSort = "normal",
  toggleAccount,
  toggleAllAccounts,
}) {
  const [search, setSearch] = useState("");
  const sort = useAutoAccountsSort(accounts, {
    enabled: showBalance,
    defaultSort,
  });
  const { sortedAccounts } = sort;

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term
      ? sortedAccounts.filter((account) => searchAutoAccount(account, term))
      : sortedAccounts;
  }, [sortedAccounts, search]);

  const selectedIds = useMemo(
    () => new Set(selectedAccounts.map((item) => item.id)),
    [selectedAccounts],
  );

  const resultsById = useMemo(
    () => (results ? new Map(results.map((r) => [r.account.id, r])) : null),
    [results],
  );

  /** The list scrolls with whatever box holds the chooser */
  const listRef = useRef(null);
  const [scrollParent, setScrollParent] = useState(null);

  useLayoutEffect(() => {
    setScrollParent(getScrollParent(listRef.current));
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-neutral-500 dark:text-neutral-400">
          Accounts ({selectedAccounts.length} / {accounts.length})
        </h4>

        {!results && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              disabled={disabled}
              onChange={(e) => toggleAllAccounts(e.target.checked)}
              className="accent-orange-500"
            />
            Toggle All
          </label>
        )}
      </div>

      {/* Search */}
      <Input
        autoFocus={autoFocusSearch}
        type="search"
        placeholder="Search accounts..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Order, only for this drop's own accounts */}
      {showBalance && (
        <AutoAccountsSortControls {...sort} />
      )}

      {/* Account List */}
      <div ref={listRef}>
        {scrollParent ? (
          <Virtuoso
            customScrollParent={scrollParent}
            data={filteredAccounts}
            computeItemKey={(_, account) => account.id}
            itemContent={(_, account) => (
              <div className="pb-1.5">
                <AccountChooserItem
                  account={account}
                  checked={selectedIds.has(account.id)}
                  result={
                    resultsById ? resultsById.get(account.id) || null : undefined
                  }
                  toggleAccount={toggleAccount}
                  showBalance={showBalance}
                  disabled={disabled}
                />
              </div>
            )}
          />
        ) : null}
      </div>
    </div>
  );
}
