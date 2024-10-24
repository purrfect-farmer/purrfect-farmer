import PumpadIcon from "../assets/images/icon.png?format=webp&w=80";
import PumpadLottery from "./PumpadLottery";
import PumpadUsernameDisplay from "./PumpadUsernameDisplay";

export default function PumpadFarmer() {
  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={PumpadIcon}
          alt="Pumpad Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Pumpad Farmer</h1>
      </div>

      {/* Username */}
      <PumpadUsernameDisplay />

      {/* Lottery */}
      <PumpadLottery />
    </div>
  );
}
