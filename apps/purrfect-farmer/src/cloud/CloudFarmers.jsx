import Input from "@/components/Input";
import UserIcon from "@/assets/images/user-icon.png?format=webp&w=256";
import farmers from "@/core/farmers";
import toast from "react-hot-toast";
import useCloudManagerDisconnectFarmerMutation from "@/hooks/useCloudManagerDisconnectFarmerMutation";
import useCloudManagerFarmersQuery from "@/hooks/useCloudManagerFarmersQuery";
import { Collapsible } from "radix-ui";
import { Dialog } from "radix-ui";
import { HiOutlineXMark } from "react-icons/hi2";
import { cn, matchesAccountSearch } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo, useState } from "react";

import CloudMemberDialog from "./CloudMemberDialog";
import useLocationToggle from "@/hooks/useLocationToggle";

const CLOUD_FARMERS = farmers.reduce((result, farmer) => {
  result.set(farmer.id, {
    title: farmer.title,
    icon: farmer.icon,
    FarmerClass: farmer.FarmerClass,
  });
  return result;
}, new Map());

const AccountDetailsDialog = ({ account, children }) => {
  const [open, setOpen] = useLocationToggle(
    `cloud-account-details:${account.id}`
  );
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
    </Dialog.Root>
  );
};

export default function CloudFarmers() {
  const [search, setSearch] = useState("");
  const disconnectFarmerMutation = useCloudManagerDisconnectFarmerMutation();
  const farmersQuery = useCloudManagerFarmersQuery();

  const groups = useMemo(
    () =>
      farmersQuery.data
        ? Object.entries(
            farmersQuery.data.reduce((result, account) => {
              account.farmers.forEach((farmer) => {
                result[farmer.farmer] = result[farmer.farmer] || [];
                result[farmer.farmer].push({ farmer, account });
              });

              return result;
            }, {})
          ).map(([k, v]) => {
            return {
              id: k,
              icon: CLOUD_FARMERS?.get(k)?.icon,
              title: CLOUD_FARMERS?.get(k)?.title || "(Unknown) Farmer",
              FarmerClass: CLOUD_FARMERS?.get(k)?.FarmerClass,
              farmers: search
                ? v.filter((item) => matchesAccountSearch(search, item.account))
                : v,
            };
          })
        : [],
    [search, farmersQuery.data]
  );

  console.log("Farmers Groups:", groups);

  const disconnectFarmer = useCallback(
    (id) => {
      toast
        .promise(disconnectFarmerMutation.mutateAsync(id), {
          success: "Successfully disconnected",
          loading: "Disconnecting...",
          error: "Error...",
        })
        .finally(farmersQuery.refetch);
    },
    [disconnectFarmerMutation.mutateAsync, farmersQuery.refetch]
  );

  return farmersQuery.isPending ? (
    <p className="text-center">Fetching Farmers...</p>
  ) : farmersQuery.isError ? (
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
              <img src={group.icon} className="w-6 h-6 rounded-full shrink-0" />
              <span className="font-bold grow">{group.title}</span>
              <span className="px-2 py-px text-xs text-white bg-purple-500 rounded-full shrink-0">
                {group.farmers.length}
              </span>
            </Collapsible.Trigger>
            <Collapsible.Content className="mb-2">
              {group.farmers.length ? (
                <div className="flex flex-col gap-1">
                  {group.farmers.map(({ farmer, account }) => (
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
                      <AccountDetailsDialog account={account}>
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
                          {typeof farmer.active !== "undefined" ? (
                            <span
                              className={cn(
                                "shrink-0 size-2 rounded-full",
                                "border-2 border-white",
                                farmer.active ? "bg-green-500" : "bg-red-500"
                              )}
                            />
                          ) : null}
                        </Dialog.Trigger>

                        <CloudMemberDialog
                          account={account}
                          farmer={{
                            ...farmer,
                            FarmerClass: group.FarmerClass,
                            title: group.title,
                            icon: group.icon,
                          }}
                        />
                      </AccountDetailsDialog>
                      {/* Terminate Button */}
                      <button
                        title="Disconnect Farmer"
                        onClick={() => disconnectFarmer(farmer.id)}
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
