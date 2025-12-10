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

const MyCloudFarmers = () => {
  const farmersQuery = useMyCloudFarmersQuery();

  return farmersQuery.isPending ? (
    <p className="text-center">Fetching Farmers...</p>
  ) : farmersQuery.isError ? (
    <p className="text-center text-red-500">Error...</p>
  ) : (
    <div className="flex flex-col gap-2">
      {farmersQuery.data.map((farmer) => (
        <MyCloudFarmerDialog key={farmer.id} farmer={farmer}>
          <Dialog.Trigger
            className={cn(
              "bg-neutral-100 dark:bg-neutral-700",
              "flex items-center gap-2 p-2 cursor-pointer rounded-xl",
              "border border-transparent",
              "hover:border-blue-500"
            )}
          >
            <img
              src={CLOUD_FARMERS.get(farmer.farmer)?.icon || AppIcon}
              className="w-6 h-6 rounded-full shrink-0"
            />
            <span className="font-bold grow">
              {CLOUD_FARMERS.get(farmer.farmer)?.title || "(Unknown) Farmer"}
            </span>
            <span
              className={cn(
                "shrink-0 size-2 rounded-full",
                "border-2 border-white",
                farmer.active ? "bg-green-500" : "bg-red-500"
              )}
            />
          </Dialog.Trigger>
        </MyCloudFarmerDialog>
      ))}
    </div>
  );
};

export default function MyCloud() {
  const { telegramUser, settings } = useAppContext();
  const initData = telegramUser?.initData;
  const enabled = settings.enableCloud && Boolean(initData);

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

          <MyCloudFarmers />
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
