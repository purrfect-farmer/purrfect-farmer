import useFarmerContext from "@/hooks/useFarmerContext";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import EnergyIcon from "../assets/images/energy.png?format=webp&w=80";
import TruecoinIcon from "../assets/images/icon.png?format=webp&w=80";
import TruecoinLottery from "./TruecoinLottery";

export default function TruecoinFarmer() {
  const { userRequest } = useFarmerContext();

  const user = userRequest.data?.user;

  const coins = user?.coins || 0;
  const energy = user?.currentSpins || 0;

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={TruecoinIcon}
          alt="Truecoin Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Truecoin Farmer</h1>
      </div>
      <h2 className="font-bold text-center text-purple-500">{user.username}</h2>

      <>
        <h3 className="text-2xl font-bold text-center text-orange-500">
          <img src={CoinIcon} className="inline w-5 h-5" />{" "}
          {Intl.NumberFormat().format(coins)}
        </h3>
        {energy > 0 ? (
          <h4 className="text-lg font-bold text-center text-purple-500">
            <img src={EnergyIcon} className="inline w-5" /> {energy}
          </h4>
        ) : null}
      </>

      {/* Lottery */}
      <TruecoinLottery />
    </div>
  );
}
