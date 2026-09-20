import { MdOutlineContentCopy, MdOutlineOpenInNew } from "react-icons/md";

import AutoAddress from "./AutoAddress";
import { cn } from "@/utils";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";

/** The drop's token contract, as a pill that copies on tap */
export default function AutoTokenContract() {
  const { config } = useAuto();

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        "p-1 pl-2 rounded-full",
        "bg-neutral-100 dark:bg-neutral-700",
      )}
    >
      {/* Token */}
      <img src={config.tokenIcon} className="size-5 rounded-full shrink-0" />
      <span className="font-bold shrink-0">{config.token}</span>

      {/* Address - tap to copy */}
      <button
        type="button"
        title={config.jettonAddress}
        onClick={() => {
          copy(config.jettonAddress);
          toast.success("Contract address copied!");
        }}
        className={cn(
          "flex items-center justify-center gap-1 grow min-w-0",
          "font-mono text-orange-500 dark:text-orange-400",
          "cursor-pointer hover:underline",
        )}
      >
        <AutoAddress address={config.jettonAddress} />
        <MdOutlineContentCopy className="size-3 shrink-0" />
      </button>

      {/* Explorer */}
      <a
        href={`https://tonviewer.com/address/${config.jettonAddress}`}
        target="_blank"
        rel="noopener noreferrer"
        title="View on Tonviewer"
        className={cn(
          "shrink-0 p-2 rounded-full",
          "text-neutral-500 dark:text-neutral-400",
          "hover:text-black dark:hover:text-white",
          "hover:bg-neutral-200 dark:hover:bg-neutral-600",
          "transition-colors",
        )}
      >
        <MdOutlineOpenInNew className="size-4" />
      </a>
    </div>
  );
}
