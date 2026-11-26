import { HiOutlineXMark } from "react-icons/hi2";
import { cn } from "@/utils";
import { memo } from "react";

import Button from "./Button";

/** The formatter for a device's last activity */
const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Join the parts that have a value */
const joinParts = (parts, separator = " ") =>
  parts.filter(Boolean).join(separator);

/** A row showing one signed in device, with a button to terminate it */
export default memo(function TelegramDeviceItem({
  device,
  isTerminating,
  onTerminate,
}) {
  /** The device's app, system and location lines */
  const app = joinParts([device.appName, device.appVersion]);
  const system = joinParts([device.platform, device.systemVersion]);
  const location = joinParts([device.region, device.country, device.ip], " · ");
  const lastActive = dateFormatter.format(device.dateActive * 1000);

  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-xl",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      {/* Details */}
      <div className="flex flex-col gap-1 grow min-w-0">
        {/* Device model and badges */}
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h3 className="font-bold min-w-0 wrap-break-word">
            {device.deviceModel || "Unknown device"}
          </h3>

          {device.current && (
            <span className="px-2 rounded-full text-white bg-green-500">
              This device
            </span>
          )}

          {device.passwordPending && (
            <span className="px-2 rounded-full text-white bg-orange-500">
              Password pending
            </span>
          )}
        </div>

        {/* App and system */}
        <p className="wrap-break-word">{joinParts([app, system], " · ")}</p>

        {/* Location and last activity */}
        <p
          className={cn(
            "wrap-break-word",
            "text-neutral-500 dark:text-neutral-400",
          )}
        >
          {joinParts([location, lastActive], " · ")}
        </p>
      </div>

      {/* Terminate button */}
      <Button
        type="button"
        variant="danger"
        title={device.current ? "Log out" : "Terminate"}
        disabled={isTerminating}
        onClick={() => onTerminate(device)}
        className="shrink-0"
      >
        <HiOutlineXMark className="size-4" />
      </Button>
    </div>
  );
});
