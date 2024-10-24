import useFarmerContext from "@/hooks/useFarmerContext";
import CoinIcon from "../assets/images/coin.svg";
import TicketIcon from "../assets/images/ticket.svg";

export default function WontonBalanceDisplay() {
  const { userRequest } = useFarmerContext();

  return (
    <div className="flex flex-col gap-2 py-4 text-center">
      {!userRequest.data ? (
        "Detecting balance..."
      ) : (
        <>
          <h3 className="flex items-center justify-center gap-2 text-xl font-bold">
            <img src={CoinIcon} className="h-4" />
            {Intl.NumberFormat().format(userRequest.data.tokenBalance)}
          </h3>
          <h4 className="flex items-center justify-center gap-2">
            <img src={TicketIcon} className="h-4" />{" "}
            {userRequest.data.ticketCount}
          </h4>
        </>
      )}
    </div>
  );
}
