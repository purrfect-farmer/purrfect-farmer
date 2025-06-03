import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

import { getResponseData } from "../lib/utils";

export default function useVoxelClaimAllInventoryMutation() {
  const { api, telegramWebApp } = useFarmerContext();
  return useMutation({
    mutationKey: ["voxel", "inventory", "claim-all"],
    mutationFn: () =>
      api
        .post("https://api.voxelplay.app/voxel/inventory/claimall", {
          initData: telegramWebApp.initData,
        })
        .then((res) => getResponseData(res.data)),
  });
}
