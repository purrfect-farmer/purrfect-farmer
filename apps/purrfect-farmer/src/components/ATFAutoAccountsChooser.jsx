import {
  MdCancel,
  MdCheckCircle,
  MdInfo,
  MdRemoveCircle,
} from "react-icons/md";
import { memo, useMemo } from "react";

import ATFAutoAccountBalance from "./ATFAutoAccountBalance";
import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
import { cn } from "@/utils";

function getInitials(title) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
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
  toggleAccount,
}) {
  const initials = useMemo(() => getInitials(account.title), [account.title]);
  const hasResult = typeof result !== "undefined";

  return (
    <label
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
        "cursor-pointer",
        disabled && "opacity-60",
      )}
    >
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
      <div
        className={cn(
          "size-8 shrink-0 rounded-full",
          "bg-orange-500 text-white",
          "flex items-center justify-center",
          "font-bold text-xs",
        )}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex flex-col grow min-w-0">
        <div className="flex items-center">
          {/* Title */}
          <h3 className="font-bold truncate w-full grow min-w-0">
            {account.title}
          </h3>
          {/* Address */}
          <div className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <ATFAutoAddress address={account.address} />
            <ATFAutoVersionBadge version={account.version} />
          </div>
        </div>
        <ATFAutoAccountBalance address={account.address} />
      </div>
    </label>
  );
});

export default function ATFAutoAccountsChooser({
  accounts,
  disabled,
  allSelected,
  selectedAccounts,
  results,
  toggleAccount,
  toggleAllAccounts,
}) {
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

      {/* Account List */}
      <div className="flex flex-col gap-1.5">
        {accounts.map((account) => (
          <AccountChooserItem
            key={account.id}
            account={account}
            checked={selectedAccounts.some((item) => item.id === account.id)}
            result={
              results
                ? results.find((r) => r.account.id === account.id) || null
                : undefined
            }
            toggleAccount={toggleAccount}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
