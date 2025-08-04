import { memo } from "react";

import CoinIcon from "../assets/images/icon.png?format=webp&w=80";
import TicketIcon from "../assets/images/rock.webp";
import useMidasUserQuery from "../hooks/useMidasUserQuery";

export default memo(function MidasBalanceDisplay() {
  const query = useMidasUserQuery();

  return (
    <div className="flex flex-col gap-2 py-2 text-center">
      {query.isPending ? (
        "Fetching balance..."
      ) : query.isSuccess ? (
        <>
          <h3 className="flex items-center justify-center gap-2 text-xl font-bold">
            <img src={CoinIcon} className="h-4 rounded-full" />
            {Intl.NumberFormat().format(query.data.points)}
          </h3>
          <h4 className="flex items-center justify-center gap-2">
            <img src={TicketIcon} className="h-4" /> {query.data.tickets}
          </h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
});
