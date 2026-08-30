import { LuPause, LuSnowflake, LuTrash } from "react-icons/lu";

import Alert from "@/components/Alert";
import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import CloudAddressDisplay from "@/cloud/CloudAddressDisplay";
import CloudStatus from "@/partials/CloudStatus";
import CloudSubscription from "@/partials/CloudSubscription";
import Container from "@/components/Container";
import { HiOutlinePower } from "react-icons/hi2";
import ProxyDetails from "@/components/ProxyDetails";
import Tabs from "@/components/Tabs";
import { cn } from "@/utils";
import { farmersMap } from "@/core/farmers";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { useCallback } from "react";
import useCloudSubscriptionQuery from "@/hooks/useCloudSubscriptionQuery";
import { useMemo } from "react";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import useMyCloudActivateFarmerMutation from "@/hooks/useMyCloudActivateFarmerMutation";
import useMyCloudDeactivateFarmerMutation from "@/hooks/useMyCloudDeactivateFarmerMutation";
import useMyCloudDeleteFarmerMutation from "@/hooks/useMyCloudDeleteFarmerMutation";
import useMyCloudFarmersQuery from "@/hooks/useMyCloudFarmersQuery";
import useMyCloudFreezeFarmerMutation from "@/hooks/useMyCloudFreezeFarmerMutation";

/* Action Button Component */
const MyCloudActionButton = ({ variant, ...props }) => (
  <button
    {...props}
    className={cn(
      {
        activate: "text-green-500 dark:text-green-400",
        deactivate: "text-orange-500 dark:text-orange-400",
        freeze: "text-sky-500 dark:text-sky-400",
        delete: "text-red-500 dark:text-red-400",
      }[variant],
      "bg-neutral-200 dark:bg-neutral-600",
      "hover:bg-neutral-300 dark:hover:bg-neutral-500",
      "p-1.5 rounded-lg shrink-0",
    )}
  />
);

/* My Cloud Farmers Component */
const MyCloudFarmers = () => {
  const { launchInAppBrowser } = useAppContext();
  const farmersQuery = useMyCloudFarmersQuery();
  const activateFarmerMutation = useMyCloudActivateFarmerMutation();
  const deactivateFarmerMutation = useMyCloudDeactivateFarmerMutation();
  const freezeFarmerMutation = useMyCloudFreezeFarmerMutation();
  const deleteFarmerMutation = useMyCloudDeleteFarmerMutation();

  /* Mapped Data */
  const data = useMemo(
    () =>
      farmersQuery.data
        ? farmersQuery.data.map((item) => {
            const details = farmersMap.get(item.farmer);
            return {
              ...item,
              title: details?.title ?? "(Unknown) Farmer",
              icon: details?.icon ?? AppIcon,
              singleton: details?.singleton ?? false,
              FarmerClass: details?.FarmerClass ?? null,
            };
          })
        : [],
    [farmersQuery.data],
  );

  /* Launch Farmer */
  const launchFarmer = useCallback(
    (farmer) => {
      if (!farmer.FarmerClass) {
        toast.error(
          "This farmer cannot be launched because it is not a valid farmer.",
        );
      } else {
        launchInAppBrowser({
          id: `farmer-${farmer.id}`,
          icon: farmer.icon,
          title: farmer.title,
          singleton: farmer.singleton,
          url: farmer.FarmerClass.getUrlFromInitData(farmer.initData),
        });
      }
    },
    [launchInAppBrowser],
  );

  /* Activate Farmer */
  const activateFarmer = useCallback(
    (id) => {
      toast
        .promise(activateFarmerMutation.mutateAsync(id), {
          success: "Successfully activated",
          loading: "Activating...",
          error: "Error...",
        })
        .finally(farmersQuery.refetch);
    },
    [activateFarmerMutation.mutateAsync, farmersQuery.refetch],
  );

  /* Deactivate Farmer */
  const deactivateFarmer = useCallback(
    (id) => {
      toast
        .promise(deactivateFarmerMutation.mutateAsync(id), {
          success: "Successfully deactivated",
          loading: "Deactivating...",
          error: "Error...",
        })
        .finally(farmersQuery.refetch);
    },
    [deactivateFarmerMutation.mutateAsync, farmersQuery.refetch],
  );

  /* Freeze Farmer */
  const freezeFarmer = useCallback(
    (id) => {
      toast
        .promise(freezeFarmerMutation.mutateAsync(id), {
          success: "Successfully frozen",
          loading: "Freezing...",
          error: "Error...",
        })
        .finally(farmersQuery.refetch);
    },
    [freezeFarmerMutation.mutateAsync, farmersQuery.refetch],
  );

  /* Delete Farmer */
  const deleteFarmer = useCallback(
    (id) => {
      toast
        .promise(deleteFarmerMutation.mutateAsync(id), {
          success: "Successfully deleted",
          loading: "Deleting...",
          error: "Error...",
        })
        .finally(farmersQuery.refetch);
    },
    [deleteFarmerMutation.mutateAsync, farmersQuery.refetch],
  );

  return farmersQuery.isPending ? (
    <p className="text-center">Fetching Farmers...</p>
  ) : farmersQuery.isError ? (
    <p className="text-center text-red-500">Error...</p>
  ) : (
    <div className="flex flex-col gap-2">
      {data.map((farmer) => (
        <div key={farmer.id} className="flex gap-2">
          <button
            onClick={() => launchFarmer(farmer)}
            className={cn(
              "bg-neutral-100 dark:bg-neutral-700",
              "flex items-center gap-2 p-2 text-left",
              "grow min-w-0 cursor-pointer rounded-xl",
              "border border-transparent",
              "hover:border-blue-500",
            )}
          >
            {/* Farmer Icon */}
            <img src={farmer.icon} className="w-6 h-6 rounded-full shrink-0" />

            {/* Farmer Title */}
            <span className="font-bold grow">{farmer.title}</span>

            {/* Active Status */}
            <span
              className={cn(
                "shrink-0 size-2 rounded-full",
                "border-2 border-white",
                {
                  active: "bg-green-500",
                  frozen: "bg-sky-500",
                  banned: "bg-red-500",
                  inactive: "bg-orange-500",
                }[farmer.status],
              )}
            />
          </button>

          <div
            className={cn(
              "flex gap-1 items-center justify-center",
              "bg-neutral-100 dark:bg-neutral-700",
              "p-1 rounded-lg shrink-0",
            )}
          >
            {/* Activate Button */}
            <MyCloudActionButton
              variant={"activate"}
              title="Activate Farmer"
              onClick={() => activateFarmer(farmer.id)}
            >
              <HiOutlinePower className="size-4" />
            </MyCloudActionButton>

            {/* Deactivate Button */}
            <MyCloudActionButton
              variant={"deactivate"}
              title="Deactivate Farmer"
              onClick={() => deactivateFarmer(farmer.id)}
            >
              <LuPause className="size-4" />
            </MyCloudActionButton>

            {/* Freeze Button */}
            <MyCloudActionButton
              variant={"freeze"}
              title="Freeze Farmer"
              onClick={() => freezeFarmer(farmer.id)}
            >
              <LuSnowflake className="size-4" />
            </MyCloudActionButton>

            {/* Delete Button */}
            <MyCloudActionButton
              variant={"delete"}
              title="Delete Farmer"
              onClick={() => deleteFarmer(farmer.id)}
            >
              <LuTrash className="size-4" />
            </MyCloudActionButton>
          </div>
        </div>
      ))}
    </div>
  );
};

/* My Cloud Proxy Details Component */
const MyCloudProxyDetails = () => {
  const { data } = useCloudSubscriptionQuery();
  const account = data?.account;
  if (!account) return null;
  return <ProxyDetails proxy={account.proxy} />;
};

/* My Cloud Main Component */
export default function MyCloud() {
  const { telegramUser, settings } = useAppContext();
  const tabs = useMirroredTabs("my-cloud", ["farmers"]);

  const auth = telegramUser?.initData;
  const enabled = settings.enableCloud && Boolean(auth);

  return (
    <Container className="p-4 flex flex-col gap-4">
      {enabled ? (
        <>
          {/* Display Address */}
          <CloudAddressDisplay />

          {/* Cloud Status */}
          <CloudStatus />

          {/* Display Subscription */}
          <CloudSubscription />

          {/* Proxy Details */}
          <MyCloudProxyDetails />

          {/* Tabs */}
          <Tabs tabs={tabs}>
            <Tabs.Content value="farmers">
              <MyCloudFarmers />
            </Tabs.Content>
          </Tabs>
        </>
      ) : (
        <Alert variant="warning">
          Cloud features are disabled. Please enable cloud features in settings
          to access cloud services.
        </Alert>
      )}
    </Container>
  );
}
