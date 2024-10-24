import useFarmerContext from "@/hooks/useFarmerContext";
import CoinIcon from "../assets/images/coin.png?format=webp&w=80";

export default function SlotcoinUsernameDisplay() {
  const { infoRequest } = useFarmerContext();
  const user = infoRequest.data?.user;

  return (
    <>
      {!user ? (
        <h4 className="text-center">Detecting Info...</h4>
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
