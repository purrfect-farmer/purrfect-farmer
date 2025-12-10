import CloudAddressDisplay from "@/cloud/CloudAddressDisplay";
import CloudServerDisplay from "@/cloud/CloudServerDisplay";
import Alert from "@/components/Alert";
import farmers from "@/core/farmers";
import useAppContext from "@/hooks/useAppContext";
import useLocationToggle from "@/hooks/useLocationToggle";
import useMyCloudFarmersQuery from "@/hooks/useMyCloudFarmersQuery";
import { cn } from "@/lib/utils";
import CloudSubscription from "@/partials/CloudSubscription";
import { Dialog } from "radix-ui";
import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import Tabs from "@/components/Tabs";
import { HiOutlinePower, HiOutlineXMark } from "react-icons/hi2";
import { useCallback } from "react";
import useMyCloudActivateFarmerMutation from "@/hooks/useMyCloudActivateFarmerMutation";
import toast from "react-hot-toast";
import useMyCloudDeactivateFarmerMutation from "@/hooks/useMyCloudDeactivateFarmerMutation";

const CLOUD_FARMERS = farmers.reduce((result, farmer) => {
  result.set(farmer.id, {
    title: farmer.title,
    icon: farmer.icon,
    FarmerClass: farmer.FarmerClass,
  });
  return result;
}, new Map());

const MyCloudFarmerDialog = ({ farmer, children }) => {
  const [open, setOpen] = useLocationToggle(
    `my-cloud-farmer-details:${farmer.id}`
  );
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      {children}
    </Dialog.Root>
  );
};

const MyCloudActionButton = ({ variant, ...props }) => (
  <button
    {...props}
    className={cn(
      variant === "activate"
        ? "text-green-500 dark:text-green-400"
        : "text-red-500 dark:text-red-400",
      "bg-neutral-100 dark:bg-neutral-700",
      "px-3 rounded-lg shrink-0"
    )}
  />
);

const MyCloudFarmers = () => {
  const farmersQuery = useMyCloudFarmersQuery();
  const activateFarmerMutation = useMyCloudActivateFarmerMutation();
  const deactivateFarmerMutation = useMyCloudDeactivateFarmerMutation();

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
    [activateFarmerMutation.mutateAsync, farmersQuery.refetch]
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
    [deactivateFarmerMutation.mutateAsync, farmersQuery.refetch]
  );

  return farmersQuery.isPending ? (
    <p className="text-center">Fetching Farmers...</p>
  ) : farmersQuery.isError ? (
    <p className="text-center text-red-500">Error...</p>
  ) : (
    <div className="flex flex-col gap-2">
      {farmersQuery.data.map((farmer) => (
        <div key={farmer.id} className="flex gap-2">
          <MyCloudFarmerDialog farmer={farmer}>
            <Dialog.Trigger
              className={cn(
                "bg-neutral-100 dark:bg-neutral-700",
                "flex items-center gap-2 p-2 text-left",
                "grow min-w-0 cursor-pointer rounded-xl",
                "border border-transparent",
                "hover:border-blue-500"
              )}
            >
              {/* Farmer Icon */}
              <img
                src={CLOUD_FARMERS.get(farmer.farmer)?.icon || AppIcon}
                className="w-6 h-6 rounded-full shrink-0"
              />

              {/* Farmer Title */}
              <span className="font-bold grow">
                {CLOUD_FARMERS.get(farmer.farmer)?.title || "(Unknown) Farmer"}
              </span>

              {/* Active Status */}
              <span
                className={cn(
                  "shrink-0 size-2 rounded-full",
                  "border-2 border-white",
                  farmer.active ? "bg-green-500" : "bg-red-500"
                )}
              />
            </Dialog.Trigger>
          </MyCloudFarmerDialog>
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
            <HiOutlineXMark className="size-4" />
          </MyCloudActionButton>
        </div>
      ))}
    </div>
  );
};

export default function MyCloud() {
  const { telegramUser, settings } = useAppContext();
  const initData = telegramUser?.initData;
  const enabled = settings.enableCloud && Boolean(initData);

  const tabs = useMirroredTabs("my-cloud", ["farmers"]);

  return (
    <div className="p-4 flex flex-col gap-4">
      {enabled ? (
        <>
          {/* Display Address */}
          <CloudAddressDisplay />

          {/* Display Server */}
          <CloudServerDisplay />

          {/* Display Subscription */}
          <CloudSubscription />

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
    </div>
  );
}
