import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

import { getResponseData } from "../lib/utils";

export default function useVoxelComboLimitQuery() {
  const { api, telegramWebApp } = useFarmerContext();
  return useQuery({
    queryKey: ["voxel", "combo-limit"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api.voxelplay.app/voxel/inventory/combo-limit",
          { initData: telegramWebApp.initData },
          {
            signal,
          }
        )
        .then((res) => getResponseData(res.data)),
  });
}
