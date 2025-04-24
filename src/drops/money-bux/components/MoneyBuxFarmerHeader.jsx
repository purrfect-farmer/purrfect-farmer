import { memo } from "react";

import MoneyBuxIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function MoneyBuxFarmerHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-center gap-2">
        <img
          src={MoneyBuxIcon}
          alt="Money Bux Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Money Bux Farmer</h1>
      </div>
    </div>
  );
});
