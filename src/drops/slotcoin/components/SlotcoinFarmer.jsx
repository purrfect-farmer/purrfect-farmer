import toast from "react-hot-toast";
import { useEffect } from "react";

import SlotcoinIcon from "../assets/images/icon.png?format=webp&w=80";
import SlotcoinInfoDisplay from "./SlotcoinInfoDisplay";
import SlotcoinLottery from "./SlotcoinLottery";
import useSlotcoinCheckInMutation from "../hooks/useSlotcoinCheckInMutation";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function SlotcoinFarmer() {
  const { checkInInfoRequest } = useFarmerContext();
  const checkInMutation = useSlotcoinCheckInMutation();

  useEffect(() => {
    if (!checkInInfoRequest.data) return;
    (async function () {
      const checkIn = checkInInfoRequest.data;

      if (Math.sign(checkIn["time_to_claim"]) === -1) {
        await checkInMutation.mutateAsync();
        toast.success("Slotcoin - Check-In");
      }
    })();
  }, [checkInInfoRequest.data]);
  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={SlotcoinIcon}
          alt="Slotcoin Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Slotcoin Farmer</h1>
      </div>

      {/* Info */}
      <SlotcoinInfoDisplay />

      {/* Lottery */}
      <SlotcoinLottery />
    </div>
  );
}
