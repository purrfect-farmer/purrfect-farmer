import { memo } from "react";

import TomarketIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function TomarketFarmerHeader() {
  return (
    <div className="flex flex-col gap-1 py-4">
      <div className="flex items-center justify-center gap-2">
        <img
          src={TomarketIcon}
          alt="Tomarket Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Tomarket Farmer</h1>
      </div>
    </div>
  );
});
