import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import useYescoinAccountInfoQuery from "../hooks/useYescoinAccountInfoQuery";

export default function YescoinBalanceDisplay() {
  const accountInfoQuery = useYescoinAccountInfoQuery();

  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center">
      <h4 className="text-2xl font-bold text-orange-500">
        <img src={CoinIcon} className="inline h-6" />{" "}
        {Intl.NumberFormat().format(accountInfoQuery.data.currentAmount)}
      </h4>
    </div>
  );
}
