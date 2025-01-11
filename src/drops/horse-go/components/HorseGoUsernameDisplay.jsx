import { memo } from "react";

import useHorseGoUserQuery from "../hooks/useHorseGoUserQuery";

export default memo(function HorseGoUsernameDisplay() {
  const query = useHorseGoUserQuery();

  return (
    <div className="py-2">
      <h4 className="font-bold text-center text-blue-200">
        {query.isPending
          ? "Fetching username..."
          : query.isSuccess
          ? query.data.tgUserName
          : "Error..."}
      </h4>
    </div>
  );
});
