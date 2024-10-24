import useAgent301BalanceQuery from "../hooks/useAgent301BalanceQuery";
import TicketIcon from "../assets/images/ticket.webp";

export default function Agent301BalanceDisplay() {
  const query = useAgent301BalanceQuery();
  const result = query.data?.result;

  return (
    <div className="flex flex-col gap-2 py-2">
      {query.isPending ? (
        <h4 className="text-center">Fetching Balance...</h4>
      ) : query.isError ? (
        <h4 className="text-center text-red-500">Failed to fetch Balance...</h4>
      ) : (
        <>
          <h3 className="text-2xl font-bold text-center">
            {Intl.NumberFormat().format(result.balance)}
          </h3>
          <p className="flex items-center justify-center gap-2" title="Tickets">
            <img src={TicketIcon} className="h-5" /> {result.tickets}
          </p>
        </>
      )}
    </div>
  );
}
