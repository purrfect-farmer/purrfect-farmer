import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

import { getResponseData } from "../lib/utils";

export default function useVoxelInventoryQuery() {
  const { api, telegramWebApp } = useFarmerContext();
  return useQuery({
    queryKey: ["voxel", "inventory"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api.voxelplay.app/voxel/inventory",
          { initData: telegramWebApp.initData },
          {
            signal,
          }
        )
        .then((res) => getResponseData(res.data)),
  });
}
