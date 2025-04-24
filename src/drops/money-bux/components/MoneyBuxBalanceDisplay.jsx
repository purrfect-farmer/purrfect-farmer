import useFarmerContext from "@/hooks/useFarmerContext";
import { memo } from "react";

import GoldIcon from "../assets/images/gold.png?format=webp&w=80";

export default memo(function MoneyBuxBalanceDisplay() {
  const query = useFarmerContext().authQuery;

  return (
    <div className="flex flex-col gap-2 py-2 text-center">
      <h3 className="flex items-center justify-center gap-2 text-xl font-bold">
        <img src={GoldIcon} className="h-4 rounded-full" />
        {query.data["main_b"]}
      </h3>
    </div>
  );
});
