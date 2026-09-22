import { Dialog } from "radix-ui";
import { HiOutlineXMark } from "react-icons/hi2";
import ParcelIcon from "@/assets/images/parcel-icon.svg";
import { PARCEL_READY_MESSAGE, PARCEL_URL } from "@/lib/autoParcel";
import { cn } from "@/utils";
import { useEffect } from "react";

/** Parcel origin, checked on every incoming message */
const PARCEL_ORIGIN = new URL(PARCEL_URL).origin;

/** Parcel home, the Split and Merge pages are reached from here */
const PARCEL_HOME_URL = new URL("/", PARCEL_URL).href;

function ParcelFrame({ payload }) {
  useEffect(() => {
    /** Parcel announces itself from Split and from Merge, so answer every time */
    function handleParcelReady(ev) {
      if (ev.origin !== PARCEL_ORIGIN) return;
      if (ev.data !== PARCEL_READY_MESSAGE) return;

      ev.source?.postMessage(payload, { targetOrigin: ev.origin });
    }

    window.addEventListener("message", handleParcelReady);

    return () => {
      window.removeEventListener("message", handleParcelReady);
    };
  }, [payload]);

  return (
    <iframe
      src={PARCEL_HOME_URL}
      title="Parcel"
      referrerPolicy="no-referrer"
      className="grow border-0 outline-0"
    />
  );
}

export default function AutoParcelDialog({ payload }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-40",
          "flex items-center justify-center",
          "bg-black/50 p-4",
        )}
      >
        <Dialog.Content
          onInteractOutside={(ev) => ev.preventDefault()}
          className={cn(
            "flex flex-col w-full h-full max-w-md max-h-[90vh]",
            "bg-white dark:bg-neutral-800 rounded-xl overflow-hidden",
          )}
        >
          {/* Header */}
          <div
            className={cn(
              "flex gap-2 items-center shrink-0 p-3",
              "border-b border-neutral-200 dark:border-neutral-700",
            )}
          >
            <div className="size-10 shrink-0" />

            {/* Title */}
            <Dialog.Title
              className={cn(
                "flex items-center justify-center gap-2",
                "grow min-w-0 font-bold truncate",
              )}
            >
              <img src={ParcelIcon} className="size-5 shrink-0" />
              Parcel
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="sr-only">
              Split and merge tokens with Parcel
            </Dialog.Description>

            {/* Close */}
            <Dialog.Close
              className={cn(
                "size-10 shrink-0 rounded-full",
                "flex items-center justify-center",
                "text-neutral-400 hover:text-orange-500 cursor-pointer",
                "transition-colors",
              )}
            >
              <HiOutlineXMark className="size-5" />
            </Dialog.Close>
          </div>

          <ParcelFrame payload={payload} />
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
