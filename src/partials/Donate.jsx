import * as Dialog from "@radix-ui/react-dialog";
import AppIcon from "@/assets/images/icon.png?format=webp&w=80";
import { cn } from "@/lib/utils";
import TonCoinIcon from "@/assets/images/toncoin-ton-logo.svg";
import { HiOutlineClipboard } from "react-icons/hi2";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";

const networks = [
  {
    name: "TON Network",
    icon: TonCoinIcon,
    address: import.meta.env.VITE_APP_DONATE_TON_ADDRESS,
  },
];

export default function Donate() {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-40",
          "flex items-center justify-center",
          "p-4 overflow-auto bg-black/50"
        )}
      >
        <Dialog.Content
          className="flex flex-col w-full max-w-sm gap-2 p-4 bg-white dark:bg-neutral-800 rounded-xl"
          onOpenAutoFocus={(ev) => ev.preventDefault()}
        >
          {/* Title */}
          <Dialog.Title
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "font-bold text-center"
            )}
          >
            <img src={AppIcon} className="w-8 h-8 rounded-full" />
            {import.meta.env.VITE_APP_NAME}
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="px-2 text-center text-neutral-500 dark:text-neutral-300">
            Thank you so much for expressing your interest in making a donation.
          </Dialog.Description>

          <div className="flex flex-col w-full gap-2">
            {networks.map((network, index) => (
              <div
                key={index}
                className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-100 dark:bg-neutral-700"
              >
                <div className="flex gap-2">
                  <img src={network.icon} className="w-10 h-10 shrink-0" />
                  <div className="flex flex-col w-full min-w-0 min-h-0 gap-1 grow">
                    <h4 className="font-bold">{network.name}</h4>
                    <p className="break-all">{network.address}</p>
                  </div>

                  {/* Copy Button */}
                  <button
                    className={cn(
                      "flex items-center justify-center shrink-0",
                      "w-8 h-8 rounded-full",
                      "bg-neutral-200 dark:bg-neutral-600"
                    )}
                    onClick={() => {
                      copy(network.address, {
                        onCopy() {
                          toast.success("Copied!");
                        },
                      });
                    }}
                  >
                    <HiOutlineClipboard className="w-4 h-4" />
                  </button>
                </div>

                {/* QR Code */}
                <QRCodeSVG
                  value={network.address}
                  title={"Donate"}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"M"}
                  size={192}
                  imageSettings={{
                    src: AppIcon,
                    x: undefined,
                    y: undefined,
                    height: 24,
                    width: 24,
                    opacity: 1,
                    excavate: true,
                  }}
                  style={{
                    width: "100%",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Cancel Button */}
          <Dialog.Close
            className={cn(
              "px-4 py-2 bg-neutral-200 dark:bg-neutral-900 rounded-lg"
            )}
          >
            Cancel
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
