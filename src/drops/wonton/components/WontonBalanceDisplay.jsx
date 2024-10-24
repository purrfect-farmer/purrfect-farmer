import CoinIcon from "../assets/images/coin.svg";
import TicketIcon from "../assets/images/ticket.svg";
import useWontonUserQuery from "../hooks/useWontonUserQuery";

export default function WontonBalanceDisplay() {
  const query = useWontonUserQuery();

  return (
    <div className="flex flex-col gap-2 py-4 text-center">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="flex items-center justify-center gap-2 text-xl font-bold">
            <img src={CoinIcon} className="h-4" />
            {Intl.NumberFormat().format(query.data.tokenBalance)}
          </h3>
          <h4 className="flex items-center justify-center gap-2">
            <img src={TicketIcon} className="h-4" /> {query.data.ticketCount}
          </h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
}
