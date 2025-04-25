import { memo } from "react";

import UnijumpIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function MoneyBuxFarmerHeader() {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-center gap-2">
        <img
          src={UnijumpIcon}
          alt="Unijump Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Unijump Farmer</h1>
      </div>
    </div>
  );
});
