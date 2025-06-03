import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

import { getResponseData } from "../lib/utils";

export default function useVoxelVerifyMissionMutation() {
  const { api, telegramWebApp } = useFarmerContext();
  return useMutation({
    mutationKey: ["voxel", "mission", "verify"],
    mutationFn: (missionID) =>
      api
        .post("https://api.voxelplay.app/voxel/mission-verify", {
          initData: telegramWebApp.initData,
          missionID,
        })
        .then((res) => getResponseData(res.data)),
  });
}
