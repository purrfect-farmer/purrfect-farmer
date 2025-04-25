import { memo } from "react";
import { useEffect } from "react";

import UnijumpFarmerHeader from "./UnijumpFarmerHeader";
import useUnijumpCreateSessionMutation from "../hooks/useUnijumpCreateSessionMutation";
import useUnijumpPlayerStateQuery from "../hooks/useUnijumpPlayerStateQuery";

export default memo(function UnijumpFarmer() {
  const playerStateQuery = useUnijumpPlayerStateQuery();
  const createSessionMutation = useUnijumpCreateSessionMutation();

  useEffect(() => {
    if (playerStateQuery.isSuccess) {
      createSessionMutation.mutateAsync().then((res) => {
        console.log(res);
      });
    }
  }, [playerStateQuery.isSuccess]);
  return (
    <div className="flex flex-col p-4">
      <UnijumpFarmerHeader />
    </div>
  );
});
