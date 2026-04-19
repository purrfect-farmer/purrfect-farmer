import AppIcon from "@/assets/images/icon.png?format=webp&w=56";
import CloudAddressDisplay from "./CloudAddressDisplay";
import CloudEnvUpdate from "./CloudEnvUpdate";
import CloudFarmers from "./CloudFarmers";
import CloudMembers from "./CloudMembers";
import CloudServerDisplay from "./CloudServerDisplay";
import CloudSubscriptionUpdate from "./CloudSubscriptionUpdate";
import CloudTools from "./CloudTools";
import Container from "@/components/Container";
import { Dialog } from "radix-ui";
import { MdEditNote } from "react-icons/md";
import Tabs from "@/components/Tabs";
import { TbCalendarUser } from "react-icons/tb";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { useState } from "react";

export default function CloudPanel() {
  const tabs = useMirroredTabs("cloud-panel", ["farmers", "members"]);

  const [openEnvUpdate, setOpenEnvUpdate] = useState(false);
  const [openSubscriptionUpdate, setOpenSubscriptionUpdate] = useState(false);

  return (
    <div className="flex flex-col grow overflow-auto">
      {/* Heading */}
      <div className="border-b shrink-0 dark:border-neutral-700">
        <Container className="flex items-center gap-2 p-2">
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
        </Container>
      </div>

      {/* Content */}
      <div className="min-w-0 min-h-0 overflow-auto grow">
        <Container className="flex flex-col gap-4 p-4">
          {/* Display Address */}
          <CloudAddressDisplay />

          {/* Display Server */}
          <CloudServerDisplay />

          {/* Cloud Tools */}
          <CloudTools />

          {/* Tabs */}
          <Tabs tabs={tabs}>
            <Tabs.Content value="farmers">
              <CloudFarmers />
            </Tabs.Content>

            <Tabs.Content value="members">
              <CloudMembers />
            </Tabs.Content>
          </Tabs>
        </Container>
      </div>
    </div>
  );
}
