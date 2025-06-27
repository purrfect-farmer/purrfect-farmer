import Farmer from "@/components/Farmer";
import { memo } from "react";

import SpaceAdventureFarmer from "./components/SpaceAdventureFarmer";
import useSpaceAdventureFarmer from "./hooks/useSpaceAdventureFarmer";

function SpaceAdventure() {
  const farmer = useSpaceAdventureFarmer();
  return (
    <Farmer farmer={farmer}>
      <SpaceAdventureFarmer />
    </Farmer>
  );
}

export default memo(SpaceAdventure);
