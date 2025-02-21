import * as Collapsible from "@radix-ui/react-collapsible";
import FunaticIcon from "@/drops/funatic/assets/images/icon.png?format=webp&w=80";
import SlotcoinIcon from "@/drops/slotcoin/assets/images/icon.png?format=webp&w=80";
import DreamCoinIcon from "@/drops/dreamcoin/assets/images/icon.png?format=webp&w=80";
import GoldEagleIcon from "@/drops/gold-eagle/assets/images/icon.png?format=webp&w=80";
import Input from "@/components/Input";
import toast from "react-hot-toast";
import useCloudAccountsQuery from "@/hooks/useCloudAccountsQuery";
import useCloudDisconnectAccountMutation from "@/hooks/useCloudDisconnectAccountMutation";
import { HiOutlineXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo, useState } from "react";

const CLOUD_FARMERS = {
  ["funatic"]: {
    title: "Funatic Farmer",
    icon: FunaticIcon,
  },
  ["gold-eagle"]: {
    title: "Gold Eagle Farmer",
    icon: GoldEagleIcon,
  },
  ["slotcoin"]: {
    title: "Slotcoin Farmer",
    icon: SlotcoinIcon,
  },
  ["dreamcoin"]: {
    title: "DreamCoin Farmer",
    icon: DreamCoinIcon,
  },
};

export default function CloudAccounts() {
  const [search, setSearch] = useState("");
  const disconnectAccountMutation = useCloudDisconnectAccountMutation();
  const accountsQuery = useCloudAccountsQuery();

  const groups = useMemo(
    () =>
      accountsQuery.data
        ? Object.entries(accountsQuery.data).map(([k, v]) => ({
            ...v,
            id: k,
            users: search
              ? v.users.filter(
                  (user) =>
                    user.username.includes(search) ||
                    user["user_id"].toString().includes(search)
                )
              : v.users,
          }))
        : [],
    [search, accountsQuery.data]
  );

  const disconnectAccount = useCallback(
    (id) => {
      toast
        .promise(disconnectAccountMutation.mutateAsync(id), {
          success: "Successfully disconnected",
          loading: "Disconnecting...",
          error: "Error...",
        })
        .then((status) => {
          if (status.kicked) {
            toast.success("User was kicked from chat");
          }
        })
        .finally(accountsQuery.refetch);
    },
    [disconnectAccountMutation.mutateAsync, accountsQuery.refetch]
  );

  return accountsQuery.isPending ? (
    <p className="text-center">Fetching Accounts...</p>
  ) : accountsQuery.isError ? (
    <p className="text-center text-red-500">Error...</p>
  ) : (
    <div className="flex flex-col gap-4">
      {/* Search */}
      <Input
        placeholder="Search"
        value={search}
        onChange={(ev) => setSearch(ev.target.value)}
      />

      {/* Accounts */}
      <div className="flex flex-col gap-2">
        {groups.map((group) => (
          <Collapsible.Root key={group.id} className="flex flex-col gap-2">
            <Collapsible.Trigger
              className={cn(
                "bg-neutral-100 dark:bg-neutral-700",
                "flex items-center gap-2 p-2 cursor-pointer rounded-xl",
                "border border-transparent",
                "data-[state=open]:border-blue-500"
              )}
            >
              <img
                src={CLOUD_FARMERS[group.id].icon}
                className="w-6 h-6 rounded-full shrink-0"
              />
              <span className="font-bold grow">
                {CLOUD_FARMERS[group.id].title}
              </span>
              <span className="px-2 py-px text-xs text-white bg-purple-500 rounded-full shrink-0">
                {group.users.length}
              </span>
            </Collapsible.Trigger>
            <Collapsible.Content className="mb-4">
              {group.users.length ? (
                group.users.map((account) => (
                  <div key={account.id} className="flex gap-2">
                    {/* Details */}
                    <div
                      className={cn(
                        "flex items-center min-w-0 min-h-0",
                        "gap-2 p-2 rounded-lg grow bg-neutral-100 dark:bg-neutral-700"
                      )}
                    >
                      <img
                        src={account["photo_url"]}
                        className="w-6 h-6 rounded-full shrink-0"
                      />{" "}
                      <h5>{account.username || account["user_id"]}</h5>
                    </div>

                    {/* Terminate Button */}
                    <button
                      title="Disconnect Account"
                      onClick={() => disconnectAccount(account.id)}
                      className={cn(
                        "text-red-600 bg-red-100",
                        "dark:text-red-500 dark:bg-neutral-700",
                        "px-3 rounded-lg shrink-0"
                      )}
                    >
                      <HiOutlineXMark className="w-5 h-5" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center">No account to display..</p>
              )}
            </Collapsible.Content>
          </Collapsible.Root>
        ))}
      </div>
    </div>
  );
}
