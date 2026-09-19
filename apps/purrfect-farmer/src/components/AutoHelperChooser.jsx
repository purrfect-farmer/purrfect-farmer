import { useMemo, useState } from "react";

import AutoAddress from "./AutoAddress";
import AutoAvatar from "./AutoAvatar";
import AutoDropVerifiedBadge from "./AutoDropVerifiedBadge";
import AutoTrustedBadge from "./AutoTrustedBadge";
import AutoVerifiedBadge from "./AutoVerifiedBadge";
import AutoVersionBadge from "./AutoVersionBadge";
import Input from "./Input";
import { cn } from "@/utils";
import { getWithdrawalTrust } from "@/lib/autoSnapshot";
import { searchAutoAccount } from "@purrfect/shared/lib/auto/wallet";
import useAutoCloudSnapshotsQuery from "@/hooks/useAutoCloudSnapshotsQuery";

/** Why an account may withdraw on another's behalf, or null when it may not */
export const getHelperKind = (account, snapshot) => {
  if (account.verified || snapshot?.verified) return "verified";

  return getWithdrawalTrust(snapshot)?.trusted ? "trusted" : null;
};

/** Split accounts into the two kinds, keeping the order they came in */
export const groupHelpers = (accounts, snapshots) => {
  const verified = [];
  const trusted = [];

  for (const account of accounts) {
    const snapshot = snapshots?.get(String(account.userId))?.snapshot;
    const kind = getHelperKind(account, snapshot);

    if (kind === "verified") verified.push(account);
    else if (kind === "trusted") trusted.push(account);
  }

  return { verified, trusted };
};

/** One selectable account, in the same idiom as the accounts chooser */
const HelperItem = ({ account, checked, disabled, onChange }) => {
  const { data } = useAutoCloudSnapshotsQuery();
  const snapshot = data?.get(String(account.userId))?.snapshot;
  const trust = getWithdrawalTrust(snapshot);

  return (
    <label
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl cursor-pointer",
        "bg-neutral-100 dark:bg-neutral-700",
        disabled && "opacity-60",
      )}
    >
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(account)}
        className="size-4 shrink-0 accent-orange-500"
      />

      <AutoAvatar account={account} className="size-8" />

      <div className="flex flex-col grow min-w-0">
        <h3 className="font-bold truncate w-full grow min-w-0">
          {account.title}
        </h3>

        <div className="flex items-center gap-1.5 text-blue-800 dark:text-blue-100">
          <AutoAddress address={account.address} />
          <AutoVersionBadge version={account.version} />
          <AutoVerifiedBadge verified={account.verified} />
          <AutoDropVerifiedBadge account={account} />
          <AutoTrustedBadge account={account} />
        </div>

        {/* What earned an unverified account its place in the list */}
        {trust?.trusted ? (
          <span className="text-neutral-500 dark:text-neutral-400">
            {trust.approved} approved, none flagged
          </span>
        ) : null}
      </div>
    </label>
  );
};

/** A section, absent when nothing qualifies under it */
const Group = ({ label, accounts, value, disabled, onChange }) => {
  if (!accounts.length) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="font-bold text-neutral-500 dark:text-neutral-400">
        {label}
      </h4>
      {accounts.map((account) => (
        <HelperItem
          key={account.id}
          account={account}
          checked={value?.id === account.id}
          disabled={disabled}
          onChange={onChange}
        />
      ))}
    </div>
  );
};

/** Choose the account that places the withdrawal, grouped by what qualifies it */
export default function AutoHelperChooser({
  accounts,
  value,
  disabled,
  onChange,
}) {
  const { data } = useAutoCloudSnapshotsQuery();
  const [search, setSearch] = useState("");

  const { verified, trusted } = useMemo(
    () => groupHelpers(accounts, data),
    [accounts, data],
  );

  /** The search narrows what is listed, never what qualifies */
  const [shownVerified, shownTrusted] = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return [verified, trusted];

    const matches = (account) => searchAutoAccount(account, term);

    return [verified.filter(matches), trusted.filter(matches)];
  }, [verified, trusted, search]);

  const nothingFound = !shownVerified.length && !shownTrusted.length;

  return (
    <div className="flex flex-col gap-3">
      <Input
        type="search"
        placeholder="Search accounts..."
        value={search}
        disabled={disabled}
        onChange={(ev) => setSearch(ev.target.value)}
      />

      {nothingFound ? (
        <p className="text-center text-neutral-500 dark:text-neutral-400">
          No account matches this search.
        </p>
      ) : null}

      <Group
        label="Verified"
        accounts={shownVerified}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
      <Group
        label="Trusted"
        accounts={shownTrusted}
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}
