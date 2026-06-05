import useAppContext from "@/hooks/useAppContext";
import { LiaUser } from "react-icons/lia";
import { cn } from "@/utils";
import { memo, useMemo } from "react";

import TabButton from "./TabButton";
import Container from "./Container";

export default memo(function TabButtonList({ tabs }) {
  const { account, mirror, sharedSettings, dispatchAndSetShowAccountPicker } =
    useAppContext();
  const otherTabs = useMemo(() => tabs.slice(1), [tabs]);
  const userFullName = useMemo(
    () =>
      account.user
        ? [account.user["first_name"], account.user["last_name"]]
            .filter(Boolean)
            .join(" ")
        : "",
    [account]
  );

  return (
    <div className="border-b dark:border-neutral-700">
      <Container
        className={cn(
          "flex items-center gap-2 p-0 pr-2 shrink-0",
          "border-b dark:border-neutral-700"
        )}
      >
        <div
          className={cn(
            "grow basis-0",
            "relative z-0",
            "flex shrink-0 py-2",
            "overflow-auto"
          )}
        >
          {/* Main */}
          <div className="sticky left-0 px-2 bg-white z-1 dark:bg-neutral-800 shrink-0">
            <TabButton
              key={tabs[0].id}
              tab={tabs[0]}
              showMirrorStatus={sharedSettings.enableMirror}
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

        {/* Account Picker Trigger */}
        {account.user ? (
          <button
            title={userFullName}
            onClick={() => dispatchAndSetShowAccountPicker(true)}
            className="shrink-0 rounded-full"
          >
            <img
              src={account.user["photo_url"]}
              className="rounded-full size-8"
            />
          </button>
        ) : (
          <button
            onClick={() => dispatchAndSetShowAccountPicker(true)}
            className={cn(
              "flex items-center justify-center",
              "shrink-0 p-2 rounded-full",
              "bg-neutral-100 dark:bg-neutral-700"
            )}
          >
            <LiaUser className="size-5" />
          </button>
        )}
      </Container>
    </div>
  );
});
