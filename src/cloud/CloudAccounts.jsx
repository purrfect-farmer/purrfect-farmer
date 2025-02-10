import useCloudAccountsQuery from "@/hooks/useCloudAccountsQuery";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import FunaticIcon from "@/drops/funatic/assets/images/icon.png?format=webp&w=80";
import GoldEagleIcon from "@/drops/gold-eagle/assets/images/icon.png?format=webp&w=80";
import { HiOutlineXMark } from "react-icons/hi2";
import useCloudDisconnectAccountMutation from "@/hooks/useCloudDisconnectAccountMutation";
import { useCallback } from "react";
import toast from "react-hot-toast";

const CLOUD_FARMERS = {
  funatic: {
    title: "Funatic Farmer",
    icon: FunaticIcon,
  },
  "gold-eagle": {
    title: "Gold Eagle Farmer",
    icon: GoldEagleIcon,
  },
};

export default function CloudAccounts() {
  const disconnectAccountMutation = useCloudDisconnectAccountMutation();
  const accountsQuery = useCloudAccountsQuery();

  const groups = useMemo(
    () =>
      accountsQuery.data
        ? Object.entries(accountsQuery.data).map(([k, v]) => ({
            id: k,
            ...v,
          }))
        : [],
    [accountsQuery.data]
  );

  const disconnectAccount = useCallback(
    (id) => {
      toast
        .promise(disconnectAccountMutation.mutateAsync(id), {
          success: "Successfully disconnected",
          loading: "Disconnecting...",
          error: "Error...",
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
      {groups.map((group) => (
        <div key={group.id} className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 px-2">
            <img
              src={CLOUD_FARMERS[group.id].icon}
              className="w-6 h-6 rounded-full shrink-0"
            />
            <span className="grow">{CLOUD_FARMERS[group.id].title}</span>
            <span className="px-2 py-px text-xs text-white bg-purple-500 rounded-full shrink-0">
              {group.total}
            </span>
          </h3>
          {group.users.map((account) => (
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
                {account.username || account["user_id"]}
              </div>

              {/* Terminate Button */}
              <button
                onClick={() => disconnectAccount(account.id)}
                className="px-3 text-white bg-red-500 rounded-lg shrink-0"
              >
                <HiOutlineXMark className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
