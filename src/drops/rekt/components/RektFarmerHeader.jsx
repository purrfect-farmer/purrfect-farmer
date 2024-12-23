import { memo } from "react";

import RektIcon from "../assets/images/icon.png?format=webp&w=80";

export default memo(function RektFarmerHeader() {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="flex items-center justify-center gap-2">
        <img
          src={RektIcon}
          alt="Rekt Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">Rekt Farmer</h1>
      </div>
    </div>
  );
});
