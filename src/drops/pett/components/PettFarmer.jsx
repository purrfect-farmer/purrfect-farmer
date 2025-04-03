import { memo } from "react";

import PettIcon from "../assets/images/icon.png?format=webp&w=80";
import usePettStatusQuery from "../hooks/usePettStatusQuery";

export default memo(function PettFarmer() {
  const statusQuery = usePettStatusQuery();

  console.log(statusQuery.data);

  return (
    <div className="flex flex-col gap-2 py-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <img
          src={PettIcon}
          alt="Pett Farmer"
          className="w-8 h-8 rounded-full"
        />
        <h1 className="font-bold">PettAI Farmer</h1>
      </div>
    </div>
  );
});
