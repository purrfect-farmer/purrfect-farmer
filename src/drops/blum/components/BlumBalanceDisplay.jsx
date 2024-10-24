import TicketIcon from "../assets/images/ticket.webp";
import useBlumBalanceQuery from "../hooks/useBlumBalanceQuery";

export default function BlumBalanceDisplay() {
  const query = useBlumBalanceQuery();

  return (
    <div className="py-4 text-center">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="text-xl font-bold">
            {Intl.NumberFormat().format(query.data.availableBalance)}
          </h3>
          <h4 className="flex items-center justify-center gap-2">
            <img src={TicketIcon} className="h-4" /> {query.data.playPasses}
          </h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
}
