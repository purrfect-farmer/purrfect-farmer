import useAppContext from "@/hooks/useAppContext";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";

import TabButton from "./TabButton";

export default memo(function TabButtonList({ tabs }) {
  const { mirror, settings } = useAppContext();
  const otherTabs = useMemo(() => tabs.slice(1), [tabs]);

  return (
    <div
      className={cn(
        "relative z-0",
        "flex shrink-0 py-2 pr-2",
        "overflow-auto scrollbar-thin",
        "border-b dark:border-neutral-700"
      )}
    >
      {/* Main */}
      <div className="sticky left-0 px-2 bg-white z-1 dark:bg-neutral-800 shrink-0">
        <TabButton
          key={tabs[0].id}
          tab={tabs[0]}
          showMirrorStatus={settings.enableMirror}
          mirrorIsConnected={mirror.connected}
        />
      </div>

      {/* Others */}
      <div className="flex gap-2 flex-nowrap shrink-0">
        {otherTabs.map((tab) => (
          <TabButton key={tab.id} tab={tab} />
        ))}
      </div>
    </div>
  );
});
