import AppIcon from "@/assets/images/icon.png?format=webp&w=56";
import Tabs from "@/components/Tabs";
import useAppContext from "@/hooks/useAppContext";
import useMirroredTabs from "@/hooks/useMirroredTabs";

import CloudFarmers from "./CloudFarmers";
import CloudMembers from "./CloudMembers";
import CloudServerDisplay from "./CloudServerDisplay";
import CloudUserDisplay from "./CloudUserDisplay";

export default function CloudPanel() {
  const { settings } = useAppContext();
  const tabs = useMirroredTabs("farmers", ["farmers", "members"]);
  const address = settings.cloudServer;

  return (
    <div className="flex flex-col grow">
      {/* Heading */}
      <div className="p-2 border-b shrink-0 dark:border-neutral-700">
        <h1 className="flex items-center justify-center gap-2 font-bold">
          <img src={AppIcon} className="w-7 h-7" /> Purrfect Cloud
        </h1>
      </div>

      {/* Content */}
      <div className="flex flex-col min-w-0 min-h-0 gap-4 p-4 overflow-auto grow scrollbar-thin">
        {/* Display Address */}
        <p className="p-2 text-center text-orange-800 bg-orange-100 rounded-lg">
          <span className="font-bold">Server</span>: {address}
        </p>

        {/* Display Server */}
        <CloudServerDisplay />

        {/* User Display */}
        <CloudUserDisplay />

        {/* Farmer */}
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
