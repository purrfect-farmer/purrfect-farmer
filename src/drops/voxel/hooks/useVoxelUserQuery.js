import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

import { getResponseData } from "../lib/utils";

export default function useVoxelUserQuery() {
  const { api, telegramWebApp } = useFarmerContext();
  return useQuery({
    queryKey: ["voxel", "user"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api.voxelplay.app/voxel/user",
          { initData: telegramWebApp.initData },
          {
            signal,
          }
        )
        .then((res) => getResponseData(res.data)),
  });
}
