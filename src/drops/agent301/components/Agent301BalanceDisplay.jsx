import TicketIcon from "../assets/images/ticket.webp";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function Agent301BalanceDisplay() {
  const { balanceRequest } = useFarmerContext();
  const result = balanceRequest.data?.result;

  return (
    <div className="flex flex-col gap-2 py-2">
      {!result ? (
        <h4 className="text-center">Detecting Balance...</h4>
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
