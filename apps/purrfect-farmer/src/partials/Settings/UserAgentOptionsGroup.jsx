import useUserAgent from "@/hooks/useUserAgent";
import { HiOutlineDevicePhoneMobile } from "react-icons/hi2";
import { LuShuffle } from "react-icons/lu";
import { cn } from "@/utils";
import { memo, useCallback, useState } from "react";
import { regenerateUserAgent } from "@/lib/userAgent";

import { SettingsGroup, SettingsLabel } from "./SettingsComponents";

const IS_WHISKER = Boolean(import.meta.env.VITE_WHISKER);

/** Button that replaces the user agent with a random one */
const RegenerateButton = memo(function RegenerateButton() {
  const [isRegenerating, setIsRegenerating] = useState(false);

  const regenerate = useCallback(async () => {
    setIsRegenerating(true);

    try {
      await regenerateUserAgent();
    } finally {
      setIsRegenerating(false);
    }
  }, []);

  return (
    <button
      type="button"
      title="Regenerate User-Agent"
      aria-label="Regenerate User-Agent"
      onClick={regenerate}
      disabled={isRegenerating}
      className={cn(
        "inline-flex items-center justify-center",
        "px-4 rounded-lg shrink-0",
        "bg-neutral-100 dark:bg-neutral-700",
        "disabled:opacity-50",
      )}
    >
      <LuShuffle className={cn("size-4", isRegenerating && "animate-pulse")} />
    </button>
  );
});

export default memo(function UserAgentOptionsGroup() {
  const userAgent = useUserAgent();

  return (
    <SettingsGroup
      id={"user-agent"}
      title={"User-Agent"}
      icon={<HiOutlineDevicePhoneMobile className="size-5" />}
    >
      <SettingsLabel>Current User-Agent</SettingsLabel>
      <div className="flex gap-2">
        <p
          className={cn(
            "min-w-0 grow p-2 rounded-lg break-all",
            "bg-neutral-100 dark:bg-neutral-700",
          )}
        >
          {userAgent}
        </p>

        {IS_WHISKER ? null : <RegenerateButton />}
      </div>

      {IS_WHISKER ? (
        <p className="text-neutral-500 dark:text-neutral-400">
          Managed by Whiskers, change it from the account form.
        </p>
      ) : null}
    </SettingsGroup>
  );
});
