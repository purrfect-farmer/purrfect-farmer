import useDropFarmer from "@/hooks/useDropFarmer";
import { useMemo } from "react";
import { useMultiRequestData } from "@/hooks/useMultiRequestData";

import YescoinIcon from "../assets/images/icon.png?format=webp&w=80";

export default function useYescoinFarmer() {
  const farmer = useDropFarmer(
    useMemo(
      () => ({
        id: "yescoin",
        host: "www.yescoin.gold",
        notification: {
          icon: YescoinIcon,
          title: "Yescoin Farmer",
        },
        domains: ["*.yescoin.gold"],
        authHeaders: ["token"],
      }),
      []
    )
  );

  const requests = useMultiRequestData(
    farmer.port,
    useMemo(
      () => ({
        accountInfoRequest:
          "https://api-backend.yescoin.gold/account/getAccountInfo",
        dailyMissionRequest:
          "https://api-backend.yescoin.gold/mission/getDailyMission",
        gameInfoRequest: "https://api-backend.yescoin.gold/game/getGameInfo",
        gameSpecialBoxInfoRequest:
          "https://api-backend.yescoin.gold/game/getSpecialBoxInfo",
        mainPageTaskRequest: "https://api-backend.yescoin.gold/task/mainPage",
        offlineRequest: "https://api-backend.yescoin.gold/user/offline",
        signInListRequest: "https://api-backend.yescoin.gold/signIn/list",
        taskListRequest: "https://api-backend.yescoin.gold/task/getTaskList",
        walletRequest: "https://api-backend.yescoin.gold/wallet/getWallet",
      }),
      []
    ),
    useMemo(() => ({ formatter: (data) => data?.data }), [])
  );

  return useMemo(
    () => ({
      ...farmer,
      ...requests,
    }),
    [farmer, requests]
  );
}
