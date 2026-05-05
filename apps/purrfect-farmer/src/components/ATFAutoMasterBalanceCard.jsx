import { MdOutlineContentCopy } from "react-icons/md";
import { useState } from "react";

import ATFAutoAddress from "./ATFAutoAddress";
import ATFAutoMasterEditDialog from "./ATFAutoMasterEditDialog";
import ATFAutoVersionBadge from "./ATFAutoVersionBadge";
import ATFIcon from "@/assets/images/atf.png?format=webp&w=32";
import { Dialog } from "radix-ui";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import TonIcon from "@/assets/images/toncoin-ton-logo.svg";
import { cn } from "@/utils";
import copy from "copy-to-clipboard";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFBalancesQuery from "@/hooks/useATFBalancesQuery";

export function ATFAutoMasterBalanceCard() {
  const { master, enableRequests, setEnableRequests } = useATFAuto();
  const { data: balances } = useATFBalancesQuery(master?.address);
  const [editOpen, setEditOpen] = useState(false);

  /** Toggle Requests */
  const toggleRequests = () => {
    setEnableRequests(!enableRequests);
    toast.success(
      enableRequests
        ? "Successfully disabled requests!"
        : "Successfully enabled requests!",
    );
  };

  return (
    <div
      className={cn(
        "p-2 rounded-2xl relative",
        "bg-neutral-950 text-white",
        "flex flex-col items-center justify-center gap-2",
      )}
    >
      {/* Toggle Requests */}
      <button
        title="Toggle requests"
        onClick={toggleRequests}
        className={cn(
          "absolute top-3 left-3",
          "p-1.5 rounded-full flex items-center justify-center",
          "bg-neutral-900 hover:bg-neutral-800",
          "cursor-pointer transition-colors",
        )}
      >
        <span
          className={cn(
            "size-2 rounded-full inline-flex",
            enableRequests ? "bg-green-500" : "bg-red-500",
          )}
        ></span>
      </button>

      {/* Edit Button */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Trigger asChild>
          <button
            className={cn(
              "absolute top-3 right-3 flex items-center justify-center",
              "p-1.5 rounded-full",
              "bg-neutral-900 hover:bg-neutral-800",
              "cursor-pointer transition-colors",
            )}
          >
            <HiOutlinePencilSquare className="size-4" />
          </button>
        </Dialog.Trigger>
        <ATFAutoMasterEditDialog onSave={() => setEditOpen(false)} />
      </Dialog.Root>

      <div className="flex justify-center items-center text-center gap-4">
        <h3 className="font-bold text-neutral-400">Master</h3>
      </div>

      {/* Jetton balance */}
      <div className="flex items-center gap-2">
        <img src={ATFIcon} className="size-5 rounded-full" />
        <span className="text-3xl">
          {balances ? balances.jetton.toFixed(2) : "-.--"}
        </span>
        <span className="text-neutral-400">ATF</span>
      </div>

      {/* TON Balance */}
      <div className="flex items-center gap-2">
        <img src={TonIcon} className="size-4" />
        <span>{balances ? balances.ton.toFixed(4) : "-.----"}</span>
        <span className="text-neutral-400">TON</span>
      </div>

      {/* Address */}
      <button
        onClick={() => {
          copy(master.address);
          toast.success("Copied");
        }}
        className="font-mono flex items-center justify-center gap-1 text-blue-300"
      >
        <MdOutlineContentCopy /> <ATFAutoAddress address={master?.address} />
      </button>
      <ATFAutoVersionBadge version={master?.version} />
    </div>
  );
}
