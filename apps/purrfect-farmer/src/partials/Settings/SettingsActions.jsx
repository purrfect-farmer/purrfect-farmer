import { HiOutlineArrowPath } from "react-icons/hi2";
import { PiTrashBold } from "react-icons/pi";
import { TbProgressCheck } from "react-icons/tb";
import { cn } from "@/lib/utils";
import { memo } from "react";

export default memo(function SettingsActions({
  farmerAccountsLength,
  dispatchAndReloadApp,
  dispatchAndRestoreSettings,
  removeActiveAccount,
}) {
  return (
    <>
      {/* Force Reload Extension */}
      <button
        type="button"
        title="Force Reload Extension"
        onClick={() => dispatchAndReloadApp(true)}
        className={cn(
          "mt-1",
          "bg-purple-100 ",
          "text-purple-900",
          "p-2.5 rounded-xl shrink-0 font-bold",
          "flex items-center justify-center gap-2"
        )}
      >
        <TbProgressCheck className="w-4 h-4" /> Force Reload Extension
      </button>

      {/* Restore Settings */}
      <button
        type="button"
        title="Restore Default Settings"
        onClick={() => dispatchAndRestoreSettings()}
        className={cn(
          "bg-orange-100",
          "text-orange-900",
          "p-2.5 rounded-xl shrink-0 font-bold",
          "flex items-center justify-center gap-2"
        )}
      >
        <HiOutlineArrowPath className="w-4 h-4" /> Restore Default Settings
      </button>

      {/* Remove Account */}
      {farmerAccountsLength > 1 ? (
        <button
          type="button"
          onClick={() => removeActiveAccount()}
          className={cn(
            "bg-red-100 dark:bg-red-600",
            "text-red-900 dark:text-red-100",
            "p-2.5 rounded-xl shrink-0 font-bold",
            "flex items-center justify-center gap-2"
          )}
        >
          <PiTrashBold className="size-4" />
          Remove Current Account
        </button>
      ) : null}
    </>
  );
});
