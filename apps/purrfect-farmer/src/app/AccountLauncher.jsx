import Alert from "@/components/Alert";
import AppIcon from "@/assets/images/icon-unwrapped-cropped.png?format=webp&h=192";
import Container from "@/components/Container";
import Input from "@/components/Input";
import { HiStar } from "react-icons/hi2";
import { LiaUser } from "react-icons/lia";
import { PiUserCirclePlusBold } from "react-icons/pi";
import { cn } from "@/utils";
import { memo, useMemo, useState } from "react";
import useSharedContext from "@/hooks/useSharedContext";

/** Single account row */
const AccountRow = memo(({ account, onLaunch }) => {
  const { user } = account;
  const fullName = user
    ? [user["first_name"], user["last_name"]].filter(Boolean).join(" ")
    : "";

  return (
    <button
      onClick={() => onLaunch(account.id)}
      className={cn(
        "px-2 py-1 rounded-xl text-left w-full",
        "bg-neutral-100 dark:bg-neutral-700",
        "hover:bg-orange-100 hover:text-orange-700",
        "dark:hover:bg-orange-200 dark:hover:text-orange-500",
        "flex items-center gap-2 group",
      )}
    >
      {/* Avatar */}
      {user?.["photo_url"] ? (
        <img src={user["photo_url"]} className="size-8 shrink-0 rounded-full" />
      ) : (
        <div className="p-1 shrink-0">
          <LiaUser className="size-5" />
        </div>
      )}

      <div className="flex flex-col grow min-w-0">
        {/* Title */}
        <h1 className="font-bold truncate w-full">
          {account.title}
          {fullName ? (
            <span
              className={cn(
                "text-neutral-500 dark:text-neutral-400",
                "group-hover:text-orange-900",
              )}
            >
              {" "}
              ({fullName})
            </span>
          ) : null}
        </h1>

        {/* Username */}
        {user?.["username"] ? (
          <h5
            className={cn(
              "truncate",
              "text-neutral-500 dark:text-neutral-400",
              "group-hover:text-orange-900",
            )}
          >
            @{user["username"]}
          </h5>
        ) : null}
      </div>

      {/* Primary */}
      {account.isPrimary ? (
        <HiStar className="shrink-0 text-lime-500 size-4" />
      ) : null}
    </button>
  );
});

/** Root account launcher shown when no account is running */
export default memo(function AccountLauncher() {
  const { accounts, addAccount, launchAccount } = useSharedContext();
  const [search, setSearch] = useState("");

  const filteredAccounts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return accounts;

    return accounts.filter((account) => {
      const { user } = account;
      const haystack = [
        account.title,
        user?.["username"],
        user?.["first_name"],
        user?.["last_name"],
        user?.["id"]?.toString(),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [accounts, search]);

  return (
    <div className="flex flex-col min-h-dvh overflow-auto">
      <Container className="flex flex-col gap-2 my-auto p-4">
        {/* Logo + Title */}
        <div className="flex flex-col items-center justify-center gap-2 shrink-0">
          <img src={AppIcon} className="h-24" />
          <h1 className="font-turret-road text-center text-2xl text-orange-500">
            {import.meta.env.VITE_APP_NAME}
          </h1>
        </div>

        {/* Disclaimer */}
        <Alert variant={"warning"}>
          By using the farmer, you accept full responsibility for any risks to
          your account. If you receive a ban, you alone are accountable.
        </Alert>

        {/* Search */}
        <Input
          type="search"
          placeholder="Search Accounts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full shrink-0"
        />

        {/* Accounts List */}
        <div className="flex flex-col gap-2">
          {filteredAccounts.length > 0 ? (
            filteredAccounts.map((account) => (
              <AccountRow
                key={account.id}
                account={account}
                onLaunch={launchAccount}
              />
            ))
          ) : (
            <p className="text-center text-neutral-400 font-bold py-4">
              No accounts found
            </p>
          )}
        </div>

        {/* Add Account */}
        {!import.meta.env.VITE_WHISKER ? (
          <button
            onClick={() => addAccount()}
            className={cn(
              "bg-purple-100 text-purple-900",
              "p-2.5 rounded-xl shrink-0 font-bold",
              "flex items-center justify-center gap-2",
            )}
          >
            <PiUserCirclePlusBold className="size-4" />
            Add Account
          </button>
        ) : null}
      </Container>
    </div>
  );
});
