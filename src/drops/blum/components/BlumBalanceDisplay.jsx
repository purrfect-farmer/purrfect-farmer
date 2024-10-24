import useFarmerContext from "@/hooks/useFarmerContext";
import TicketIcon from "../assets/images/ticket.webp";

export default function BlumBalanceDisplay() {
  const { balanceRequest } = useFarmerContext();

  return (
    <div className="py-4 text-center">
      {!balanceRequest.data ? (
        "Detecting balance..."
      ) : (
        <>
          <h3 className="text-xl font-bold">
            {Intl.NumberFormat().format(balanceRequest.data.availableBalance)}
          </h3>
          <h4 className="flex items-center justify-center gap-2">
            <img src={TicketIcon} className="h-4" />{" "}
            {balanceRequest.data.playPasses}
          </h4>
        </>
      )}
    </div>
  );
}
