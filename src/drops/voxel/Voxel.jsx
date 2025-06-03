import Farmer from "@/components/Farmer";
import { memo } from "react";

import VoxelFarmer from "./components/VoxelFarmer";
import useVoxelFarmer from "./hooks/useVoxelFarmer";

function Voxel() {
  const farmer = useVoxelFarmer();
  return (
    <Farmer farmer={farmer}>
      <VoxelFarmer />
    </Farmer>
  );
}

export default memo(Voxel);
