import * as Collapsible from "@radix-ui/react-collapsible";
import * as Dialog from "@radix-ui/react-dialog";
import Input from "@/components/Input";
import toast from "react-hot-toast";
import useCloudAccountsQuery from "@/hooks/useCloudAccountsQuery";
import useCloudDisconnectAccountMutation from "@/hooks/useCloudDisconnectAccountMutation";
import useCloudKickAccountMutation from "@/hooks/useCloudKickAccountMutation";
import { HiOutlineXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo, useState } from "react";

const CLOUD_FARMERS = Object.fromEntries(
  Object.values(
    import.meta.glob("@/drops/*/index.js", { eager: true, import: "default" })
  ).map(({ id, title, icon }) => [
    id,
    {
      title: `${title} Farmer`,
      icon,
    },
  ])
);

export default function CloudAccounts() {
  const [search, setSearch] = useState("");
  const kickAccountMutation = useCloudKickAccountMutation();
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
                    user["username"]
                      .replaceAll("@", "")
                      .toLowerCase()
                      .includes(search.replaceAll("@", "").toLowerCase()) ||
                    user["title"]
                      ?.toLowerCase()
                      ?.includes(search.toLowerCase()) ||
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
        .finally(accountsQuery.refetch);
    },
    [disconnectAccountMutation.mutateAsync, accountsQuery.refetch]
  );

  const kickAccount = useCallback(
    (id) => {
      toast
        .promise(kickAccountMutation.mutateAsync(id), {
          success: "Successfully kicked",
          loading: "Kicking...",
          error: "Error...",
        })
        .finally(accountsQuery.refetch);
    },
    [kickAccountMutation.mutateAsync, accountsQuery.refetch]
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
                src={CLOUD_FARMERS[group.id]?.icon}
                className="w-6 h-6 rounded-full shrink-0"
              />
              <span className="font-bold grow">
                {CLOUD_FARMERS[group.id]?.title || "(Unknown) Farmer"}
              </span>
              <span className="px-2 py-px text-xs text-white bg-purple-500 rounded-full shrink-0">
                {group.users.length}
              </span>
            </Collapsible.Trigger>
            <Collapsible.Content className="mb-2">
              {group.users.length ? (
                <div className="flex flex-col gap-1">
                  {group.users.map((account) => (
                    <div key={account.id} className="flex gap-2">
                      {/* Title */}
                      {account.title ? (
                        <h4
                          className={cn(
                            "font-bold",
                            "text-blue-500 dark:text-blue-400",
                            "flex items-center justify-center",
                            "px-3 rounded-lg shrink-0",
                            "bg-neutral-100 dark:bg-neutral-700"
                          )}
                        >
                          {account.title}
                        </h4>
                      ) : null}{" "}
                      {/* Details */}
                      <Dialog.Root>
                        <Dialog.Trigger
                          className={cn(
                            "flex items-center min-w-0 min-h-0",
                            "gap-2 p-2 rounded-lg grow bg-neutral-100 dark:bg-neutral-700",
                            "text-left"
                          )}
                        >
                          {/* Photo */}
                          <img
                            src={account["photo_url"]}
                            className="w-6 h-6 rounded-full shrink-0"
                          />{" "}
                          {/* Username */}
                          <h5 className="grow min-w-0 min-h-0 truncate">
                            {account.username || account["user_id"]}
                          </h5>
                          {typeof account["is_connected"] !== "undefined" ? (
                            <span
                              className={cn(
                                "shrink-0 size-2 rounded-full",
                                "border-2 border-white",
                                account["is_connected"]
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              )}
                            />
                          ) : null}
                        </Dialog.Trigger>

                        <Dialog.Portal>
                          <Dialog.Overlay
                            className={cn(
                              "fixed inset-0 z-40",
                              "flex items-center justify-center",
                              "p-4 overflow-auto bg-black/50"
                            )}
                          >
                            <Dialog.Content className="flex flex-col w-full max-w-sm gap-2 p-4 bg-white dark:bg-neutral-800 rounded-xl">
                              <img
                                src={account["photo_url"]}
                                className="w-24 h-24 rounded-full mx-auto"
                              />

                              {/* Title */}
                              <Dialog.Title
                                className={cn(
                                  "inline-flex items-center justify-center gap-2",
                                  "text-center",
                                  "text-xl truncate",
                                  "font-turret-road text-orange-500"
                                )}
                              >
                                @{account["username"]}
                              </Dialog.Title>

                              {/* Description */}
                              <Dialog.Description className="px-2 text-lg text-center text-blue-500">
                                {account.title}
                              </Dialog.Description>

                              {/* Kick Button */}
                              <button
                                title="Kick User"
                                disabled={kickAccountMutation.isPending}
                                onClick={() => kickAccount(account.id)}
                                className={cn(
                                  "px-4 py-2 bg-red-500 text-white rounded-lg",
                                  "disabled:opacity-60"
                                )}
                              >
                                Kick User
                              </button>

                              {/* Cancel Button */}
                              <Dialog.Close
                                disabled={kickAccountMutation.isPending}
                                className={cn(
                                  "px-4 py-2 bg-neutral-200 dark:bg-neutral-900 rounded-lg",
                                  "disabled:opacity-60"
                                )}
                              >
                                Cancel
                              </Dialog.Close>
                            </Dialog.Content>
                          </Dialog.Overlay>
                        </Dialog.Portal>
                      </Dialog.Root>
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
                  ))}
                </div>
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
