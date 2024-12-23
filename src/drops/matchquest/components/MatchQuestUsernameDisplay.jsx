import { memo } from "react";

import useMatchQuestUserQuery from "../hooks/useMatchQuestUserQuery";

export default memo(function MatchQuestUsernameDisplay() {
  const query = useMatchQuestUserQuery();

  return (
    <div className="py-2">
      <h4 className="text-center">
        {query.isPending
          ? "Fetching username..."
          : query.isSuccess
          ? query.data["Username"]
          : "Error..."}
      </h4>
    </div>
  );
});
