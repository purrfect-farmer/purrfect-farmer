import { memo } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import GemsIcon from "../assets/images/gems.png?format=webp&w=80";
import useSpaceAdventureUserQuery from "../hooks/useSpaceAdventureUserQuery";

export default memo(function SpaceAdventureInfoDisplay() {
  const userQuery = useSpaceAdventureUserQuery();
  const user = userQuery?.data?.user;
  const coinBalance = user?.["balance"];
  const gemsBalance = user?.["gems"];
  const banned = Boolean(user?.["block_account"]);

  return (
    <div className="flex flex-col text-center ">
      {userQuery.isPending ? (
        "Fetching balance..."
      ) : userQuery.isSuccess ? (
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold text-center text-orange-500">
            <img src={CoinIcon} className="inline-flex size-5" />{" "}
            {Intl.NumberFormat().format(coinBalance || 0)}
          </h2>
          <h3 className="font-bold text-lg text-center text-purple-500">
            <img src={GemsIcon} className="inline-flex size-4" />{" "}
            {Intl.NumberFormat().format(gemsBalance || 0)}
          </h3>
          {banned ? (
            <p className="text-center">
              <span className="text-red-500 border border-red-500">BANNED</span>
            </p>
          ) : null}
        </div>
      ) : (
        "Error..."
      )}
    </div>
  );
});
