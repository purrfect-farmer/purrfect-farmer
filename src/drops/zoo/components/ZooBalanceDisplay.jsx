import useZooDataQueries from "../hooks/useZooDataQueries";
import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import FoodIcon from "../assets/images/food.png?format=webp&w=80";
import TPHIcon from "../assets/images/tph.png?format=webp&w=80";

export default function ZooBalanceDisplay() {
  const dataQueries = useZooDataQueries();
  const hero = dataQueries.data?.[0]?.hero;

  return (
    <div className="flex flex-col items-center justify-center gap-1 text-center">
      {/* Food */}
      <h4 className="flex items-center justify-center gap-2 text-lg font-bold">
        <img src={FoodIcon} className="w-6 h-6" />{" "}
        {Intl.NumberFormat().format(hero.coins)}
      </h4>

      {/* Coins */}
      <h4 className="flex items-center justify-center gap-2 text-2xl font-bold">
        <img src={CoinIcon} className="w-6 h-6" />{" "}
        {Intl.NumberFormat().format(hero.tokens)}
      </h4>

      {/* Total Profit Per Hour */}
      <h4 className="flex items-center justify-center gap-2 font-bold">
        <img src={TPHIcon} className="w-4 h-4" /> TPH{" "}
        {Intl.NumberFormat().format(hero.tph)}
      </h4>
    </div>
  );
}
