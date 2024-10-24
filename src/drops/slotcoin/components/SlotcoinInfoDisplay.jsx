import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import useSlotcoinInfoQuery from "../hooks/useSlotcoinInfoQuery";

export default function SlotcoinUsernameDisplay() {
  const query = useSlotcoinInfoQuery();
  const user = query.data?.user;

  return (
    <>
      {query.isPending ? (
        <h4 className="text-center">Fetching Info...</h4>
      ) : query.isError ? (
        <h4 className="text-center text-red-500">Error Fetching Info...</h4>
      ) : (
        <div className="flex flex-col gap-2">
          <h3 className="text-2xl font-bold text-center text-orange-500">
            <img src={CoinIcon} className="inline w-5 h-5" />{" "}
            {Intl.NumberFormat().format(user.balance)}
          </h3>
        </div>
      )}
    </>
  );
}
