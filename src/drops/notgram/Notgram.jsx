import Farmer from "@/components/Farmer";
import { memo } from "react";

import NotgramFarmer from "./components/NotgramFarmer";
import useNotgramFarmer from "./hooks/useNotgramFarmer";

export default memo(function Notgram() {
  const farmer = useNotgramFarmer();
  return (
    <Farmer
      farmer={farmer}
      className="text-[#f5bb5f] bg-neutral-800"
      initClassName="text-neutral-400"
    >
      <NotgramFarmer />
    </Farmer>
  );
});
