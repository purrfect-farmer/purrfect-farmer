import AppIcon from "@/assets/images/icon.png?format=webp&w=56";
import Tabs from "@/components/Tabs";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { Dialog } from "radix-ui";
import CloudFarmers from "./CloudFarmers";
import CloudMembers from "./CloudMembers";
import CloudServerDisplay from "./CloudServerDisplay";
import CloudSubscriptionUpdate from "./CloudSubscriptionUpdate";
import CloudUserDisplay from "./CloudUserDisplay";
import { TbCalendarUser } from "react-icons/tb";
import { MdEditNote } from "react-icons/md";
import CloudEnvUpdate from "./CloudEnvUpdate";
import useLocationToggle from "@/hooks/useLocationToggle";
import CloudAddressDisplay from "./CloudAddressDisplay";

export default function CloudPanel() {
  const tabs = useMirroredTabs("cloud-panel", ["farmers", "members"]);

  const [openEnvUpdate, setOpenEnvUpdate] =
    useLocationToggle("cloud-env-update");

  const [openSubscriptionUpdate, setOpenSubscriptionUpdate] = useLocationToggle(
    "cloud-subscription-update"
  );

  return (
    <div className="flex flex-col grow">
      {/* Heading */}
      <div className="p-2 border-b shrink-0 dark:border-neutral-700 flex items-center gap-2">
        <Dialog.Root open={openEnvUpdate} onOpenChange={setOpenEnvUpdate}>
          <Dialog.Trigger className="text-orange-500 size-8 flex items-center justify-center">
            <MdEditNote className="size-5" />
          </Dialog.Trigger>

          <CloudEnvUpdate />
        </Dialog.Root>

        <h1 className="flex items-center justify-center gap-2 font-bold grow">
          <img src={AppIcon} className="w-7 h-7" /> Purrfect Cloud
        </h1>

        <Dialog.Root
          open={openSubscriptionUpdate}
          onOpenChange={setOpenSubscriptionUpdate}
        >
          <Dialog.Trigger className="text-orange-500 size-8 flex items-center justify-center">
            <TbCalendarUser className="size-5" />
          </Dialog.Trigger>

          <CloudSubscriptionUpdate />
        </Dialog.Root>
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 min-h-0 gap-4 p-4 overflow-auto grow scrollbar-thin">
        {/* Display Address */}
        <CloudAddressDisplay />

        {/* Display Server */}
        <CloudServerDisplay />

        {/* User Display */}
        <CloudUserDisplay />

        {/* Tabs */}
        <Tabs tabs={tabs}>
          <Tabs.Content value="farmers">
            <CloudFarmers />
          </Tabs.Content>

          <Tabs.Content value="members">
            <CloudMembers />
          </Tabs.Content>
        </Tabs>
      </div>
    </div>
  );
}
