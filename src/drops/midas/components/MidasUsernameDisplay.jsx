import { memo } from "react";

import useMidasUserQuery from "../hooks/useMidasUserQuery";

export default memo(function MidasUsernameDisplay() {
  const query = useMidasUserQuery();

  return (
    <div className="py-2">
      <h4 className="font-bold text-center text-orange-500">
        {query.isPending
          ? "Fetching username..."
          : query.isSuccess
          ? query.data.username
          : "Error..."}
      </h4>
    </div>
  );
});
