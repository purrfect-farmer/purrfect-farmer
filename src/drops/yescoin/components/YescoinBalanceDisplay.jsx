import useFarmerContext from "@/hooks/useFarmerContext";
import CoinIcon from "../assets/images/coin.png?format=webp&w=80";

export default function YescoinBalanceDisplay() {
  const { accountInfoRequest } = useFarmerContext();

  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center">
      <h4 className="text-2xl font-bold text-orange-500">
        <img src={CoinIcon} className="inline h-6" />{" "}
        {Intl.NumberFormat().format(accountInfoRequest.data.currentAmount)}
      </h4>
    </div>
  );
}
