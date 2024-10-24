import toast from "react-hot-toast";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import useYescoinCheckDailyMissionMutation from "../hooks/useYescoinCheckDailyMissionMutation";
import useYescoinClaimMissionMutation from "../hooks/useYescoinClaimMissionMutation";
import useYescoinClickDailyMissionMutation from "../hooks/useYescoinClickDailyMissionMutation";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function YescoinDailyMission() {
  const { dailyMissionRequest } = useFarmerContext();
  const missions = useMemo(
    () =>
      dailyMissionRequest.data?.filter(
        (mission) => !["CheckIn"].includes(mission.link)
      ) || [],
    [dailyMissionRequest.data]
  );

  const clickMissionMutation = useYescoinClickDailyMissionMutation();
  const checkMissionMutation = useYescoinCheckDailyMissionMutation();
  const claimMissionMutation = useYescoinClaimMissionMutation();

  const [claimTask, dispatchAndClaimTask] = useSocketDispatchCallback(
    /** Main */
    useCallback(async (id) => {
      /** Click */
      await toast.promise(
        (async function () {
          /** Click */
          await clickMissionMutation.mutateAsync(id);
          await delay(5000);

          /** Check */
          const result = await checkMissionMutation.mutateAsync(id);
          await delay(5000);

          if (!result) {
            throw "Not Completed!";
          } else {
            /** Claim */
            await claimMissionMutation.mutateAsync(id);
          }
        })(),
        {
          loading: "Working...",
          error: "Error!",
          success: "Successfully Claimed",
        }
      );
    }, []),

    /** Dispatch */
    useCallback((socket, id) => {
      socket.dispatch({
        action: "yescoin.missions.claim",
        data: {
          id,
        },
      });
    }, [])
  );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "yescoin.missions.claim": (command) => {
          claimTask(command.data.id);
        },
      }),
      [claimTask]
    )
  );

  return !dailyMissionRequest.data ? (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  ) : (
    <div className="flex flex-col gap-2">
      {missions.map((mission) => (
        <button
          key={mission.missionId}
          onClick={() => dispatchAndClaimTask(mission.missionId)}
          disabled={mission["missionStatus"]}
          className={cn(
            "flex items-center gap-2 p-2 rounded-lg bg-neutral-50",
            "disabled:opacity-50",
            "text-left"
          )}
        >
          <img src={mission["iconLink"]} className="w-10 h-10 shrink-0" />
          <div className="flex flex-col min-w-0 min-h-0 grow">
            <h1 className="font-bold">{mission["name"]}</h1>
            <p className="text-orange-500">
              +{Intl.NumberFormat().format(mission["reward"])}{" "}
              <img src={CoinIcon} className="inline h-4" />
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
