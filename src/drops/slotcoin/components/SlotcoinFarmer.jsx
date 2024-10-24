import toast from "react-hot-toast";
import { useEffect } from "react";

import SlotcoinIcon from "../assets/images/icon.png?format=webp&w=80";
import SlotcoinInfoDisplay from "./SlotcoinInfoDisplay";
import SlotcoinLottery from "./SlotcoinLottery";
import useSlotcoinCheckInInfoQuery from "../hooks/useSlotcoinCheckInInfoQuery";
import useSlotcoinCheckInMutation from "../hooks/useSlotcoinCheckInMutation";

export default function SlotcoinFarmer() {
  const checkInQuery = useSlotcoinCheckInInfoQuery();
  const checkInMutation = useSlotcoinCheckInMutation();

  useEffect(() => {
    if (!checkInQuery.data) return;
    (async function () {
      const checkIn = checkInQuery.data;

      if (Math.sign(checkIn["time_to_claim"]) === -1) {
        await checkInMutation.mutateAsync();
        toast.success("Slotcoin - Check-In");
      }
    })();
  }, [checkInQuery.data]);
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
