import { memo } from "react";

import TicketIcon from "../assets/images/icon_daily_play_count.png";
import useMatchQuestGameRuleQuery from "../hooks/useMatchQuestGameRuleQuery";

export default memo(function MatchQuestTicketsDisplay() {
  const query = useMatchQuestGameRuleQuery();

  return (
    <div className="py-2 text-center">
      {query.isPending ? (
        "Fetching tickets..."
      ) : query.isSuccess ? (
        <>
          <h4 className="flex items-center justify-center gap-2">
            <img src={TicketIcon} className="h-4" /> {query.data["game_count"]}
          </h4>
        </>
      ) : (
        "Error..."
      )}
    </div>
  );
});
