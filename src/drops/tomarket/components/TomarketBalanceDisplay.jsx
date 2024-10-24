import TicketIcon from "../assets/images/ticket.webp";
import useTomarketBalanceQuery from "../hooks/useTomarketBalanceQuery";

export default function TomarketBalanceDisplay() {
  const query = useTomarketBalanceQuery();

  return (
    <div className="py-4 text-center">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="text-xl font-bold">
            {Intl.NumberFormat().format(query.data["available_balance"])}
          </h3>
          <h4 className="flex items-center justify-center gap-2">
            <img src={TicketIcon} className="h-4" /> {query.data["play_passes"]}
          </h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
}
