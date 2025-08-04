import { memo } from "react";

import useRektUserQuery from "../hooks/useRektUserQuery";

export default memo(function RektUsernameDisplay() {
  const query = useRektUserQuery();

  return (
    <div className="py-2">
      <h4 className="font-bold text-center text-blue-200">
        {query.isPending
          ? "Fetching username..."
          : query.isSuccess
          ? query.data.telegramUsername
          : "Error..."}
      </h4>
    </div>
  );
});
