import Farmer from "@/components/Farmer";
import FarmerHeader from "@/components/FarmerHeader";
import useDropFarmer from "@/hooks/useDropFarmer";
import useTerminalFarmer from "@/hooks/useTerminalFarmer";
import { HiPlay, HiStop } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { memo } from "react";

const TerminalFarmerContent = () => {
  const { referralLink, terminalRef, started, start, stop } =
    useTerminalFarmer();

  return (
    <>
      <div className="p-2 border-b dark:border-neutral-700">
        <FarmerHeader referralLink={referralLink} />
      </div>

      <button
        onClick={started ? stop : start}
        className={cn(
          "flex items-center justify-center gap-2 p-2",
          started ? "text-red-500" : "text-green-500"
        )}
      >
        {started ? (
          <HiStop className="size-5" />
        ) : (
          <HiPlay className="size-5" />
        )}
        {started ? "Stop" : "Start"}
      </button>
      <div
        ref={terminalRef}
        className="grow overflow-auto bg-black text-white p-2 font-mono whitespace-pre-wrap"
      />
    </>
  );
};

function TerminalFarmer() {
  const farmer = useDropFarmer();
  return (
    <Farmer farmer={farmer}>
      <TerminalFarmerContent />
    </Farmer>
  );
}

export default memo(TerminalFarmer);
