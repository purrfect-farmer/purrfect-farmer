import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import useYescoinAccountInfoQuery from "../hooks/useYescoinAccountInfoQuery";
import useYescoinCheckDailyMissionMutation from "../hooks/useYescoinCheckDailyMissionMutation";
import useYescoinClaimMissionMutation from "../hooks/useYescoinClaimMissionMutation";
import useYescoinClickDailyMissionMutation from "../hooks/useYescoinClickDailyMissionMutation";
import useYescoinDailyMissionQuery from "../hooks/useYescoinDailyMissionQuery";
import useYescoinFinishTaskBonusInfoQuery from "../hooks/useYescoinFinishTaskBonusInfoQuery";

export default memo(function YescoinDailyMission() {
  const finishTaskBonusInfoQuery = useYescoinFinishTaskBonusInfoQuery();
  const accountInfoQuery = useYescoinAccountInfoQuery();
  const missionsQuery = useYescoinDailyMissionQuery();
  const missions = useMemo(
    () =>
      missionsQuery.data?.filter(
        (mission) => ["ton", "star", "CheckIn"].includes(mission.link) === false
      ) || [],
    [missionsQuery.data]
  );

  const uncompletedMissions = useMemo(
    () => missions.filter((item) => !item.missionStatus),
    [missions]
  );

  const clickMissionMutation = useYescoinClickDailyMissionMutation();
  const checkMissionMutation = useYescoinCheckDailyMissionMutation();
  const claimMissionMutation = useYescoinClaimMissionMutation();

  const process = useProcessLock("yescoin.daily-missions");
  const [missionOffset, setMissionOffset] = useState(null);
  const [currentMission, setCurrentMission] = useState(null);

  const reset = useCallback(() => {
    setMissionOffset(null);
    setCurrentMission(null);
  }, [setMissionOffset, setCurrentMission]);

  const runMission = useCallback(async (id) => {
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
  }, []);

  const [claimMission, dispatchAndClaimMission] = useMirroredCallback(
    "yescoin.claim-mission",
    async (id) => {
      if (
        !missions.some(
          (mission) => mission.missionId === id && !mission.missionStatus
        )
      )
        return;

      await runMission(id);

      await missionsQuery.refetch();
      await accountInfoQuery.refetch();
    },
    [missions, runMission]
  );

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute the process */
    process.execute(async function () {
      for (let [index, mission] of Object.entries(uncompletedMissions)) {
        if (process.controller.signal.aborted) return;
        setMissionOffset(index);
        setCurrentMission(mission);

        try {
          await runMission(mission.missionId);
        } catch (e) {
          console.error(e);
        }

        /** Delay */
        await delay(3_000);
      }

      try {
        await missionsQuery.refetch();
        await accountInfoQuery.refetch();
        await finishTaskBonusInfoQuery.refetch();
      } catch (e) {
        console.error(e);
      }

      /** Stop */
      return true;
    });
  }, [process]);

  /** Auto-Complete Missions */
  useFarmerAutoProcess("missions", process, [
    missionsQuery.isLoading === false,
  ]);

  return missionsQuery.isPending ? (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  ) : missionsQuery.isError ? (
    <div className="text-center">Error....</div>
  ) : (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 rounded-lg text-white font-bold disabled:opacity-50",
          !process.started ? "bg-purple-500" : "bg-red-500"
        )}
      >
        {!process.started ? "Auto Claim" : "Stop"}
      </button>

      {process.started && currentMission ? (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-900">
          <h4 className="font-bold">
            <span className="text-yellow-500">
              Running Mission{" "}
              {missionOffset !== null ? +missionOffset + 1 : null}
            </span>
          </h4>
          <h5 className="font-bold text-purple-500">
            {currentMission.name}...
          </h5>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {missions.map((mission) => (
          <button
            key={mission.missionId}
            onClick={() => dispatchAndClaimMission(mission.missionId)}
            disabled={mission["missionStatus"]}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-700",
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
    </div>
  );
});
