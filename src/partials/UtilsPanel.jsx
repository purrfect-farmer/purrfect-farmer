import * as Dialog from "@radix-ui/react-dialog";
import ConfirmButton from "@/components/ConfirmButton";
import CoreSystemIcon from "@/assets/images/core-system.png?format=webp&w=128";
import Input from "@/components/Input";
import useAppContext from "@/hooks/useAppContext";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function UtilsPanel({ open, onOpenChange }) {
  const { dispatchAndOpenTelegramLink } = useAppContext();

  /** Sync Server */
  const [telegramLink, setTelegramLink] = useState("");

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
        <Dialog.Content
          className={cn(
            "bg-white dark:bg-neutral-800",
            "fixed z-50 inset-x-0 bottom-0 flex flex-col h-3/4 rounded-t-xl",
            "flex flex-col"
          )}
          onOpenAutoFocus={(ev) => ev.preventDefault()}
        >
          <>
            <div className="flex flex-col min-w-0 min-h-0 gap-2 p-4 overflow-auto grow">
              <img src={CoreSystemIcon} className="w-16 mx-auto" />

              <Dialog.Title className="text-lg font-bold text-center">
                <span
                  className={cn(
                    "text-transparent font-bold",
                    "bg-clip-text",
                    "bg-gradient-to-r from-pink-500 to-violet-500"
                  )}
                >
                  {import.meta.env.VITE_CORE_SYSTEM_NAME}
                </span>
              </Dialog.Title>
              <Dialog.Description className="text-center">
                <span
                  className={cn(
                    "text-transparent font-bold",
                    "bg-clip-text",
                    "bg-gradient-to-r from-green-500 to-blue-500"
                  )}
                >
                  Core System Tools
                </span>
              </Dialog.Description>

              <div className="flex flex-col gap-2 py-4">
                {/* Open Telegram Link */}
                <label className="text-neutral-400">Open Telegram Link</label>
                <div className="flex gap-2">
                  <Input
                    value={telegramLink}
                    onChange={(ev) => setTelegramLink(ev.target.value)}
                    placeholder="e.g https://t.me/..."
                  />

                  {/* Set Button */}
                  <ConfirmButton
                    onClick={() => {
                      dispatchAndOpenTelegramLink(telegramLink);
                      onOpenChange(false);
                    }}
                  >
                    <HiArrowTopRightOnSquare className="w-4 h-4 " />
                  </ConfirmButton>
                </div>
                <p
                  className={cn(
                    "bg-yellow-100 dark:bg-yellow-900",
                    "text-yellow-800 dark:text-yellow-100",
                    "p-4 text-center  rounded-lg"
                  )}
                >
                  You can paste any valid telegram link e.g your referral link,
                  a channel etc.
                </p>
              </div>
            </div>
            <div className="flex flex-col p-4 font-bold shrink-0">
              <Dialog.Close className="p-2.5 text-white bg-blue-500 rounded-xl">
                Close
              </Dialog.Close>
            </div>
          </>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
