import Input from "@/components/Input";
import UserIcon from "@/assets/images/user-icon.png?format=webp&w=256";
import useCloudManagerMembersQuery from "@/hooks/useCloudManagerMembersQuery";
import { Dialog } from "radix-ui";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";
import { cn, matchesAccountSearch } from "@/lib/utils";
import { useMemo, useState } from "react";

import CloudMemberDialog from "./CloudMemberDialog";

export default function CloudMembers() {
  const [search, setSearch] = useState("");
  const membersQuery = useCloudManagerMembersQuery();

  const members = useMemo(
    () =>
      membersQuery.data
        ? search
          ? membersQuery.data.filter((item) =>
              matchesAccountSearch(search, item)
            )
          : membersQuery.data
        : [],
    [search, membersQuery.data]
  );

  return membersQuery.isPending ? (
    <p className="text-center">Fetching Members...</p>
  ) : membersQuery.isError ? (
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
        {members.length ? (
          <div className="flex flex-col gap-1">
            {members.map((account) => (
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
                      src={account.user?.["photo_url"] || UserIcon}
                      className="w-6 h-6 rounded-full shrink-0"
                    />{" "}
                    {/* Username */}
                    <h5 className="grow min-w-0 min-h-0 truncate">
                      {account.user?.["username"] || account.id}
                    </h5>
                  </Dialog.Trigger>

                  <CloudMemberDialog account={account} />
                </Dialog.Root>
                {/* Terminate Button */}
                <span
                  className={cn(
                    "flex items-center justify-center",
                    "bg-neutral-100 dark:bg-neutral-700",
                    "px-3 rounded-lg shrink-0"
                  )}
                >
                  {account.subscriptions.length ? (
                    <HiCheckCircle className="size-5 text-green-500" />
                  ) : (
                    <HiXCircle className="size-5 text-red-500" />
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center">No account to display..</p>
        )}
      </div>
    </div>
  );
}
