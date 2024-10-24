import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useTadaCompleteMissionMutation from "../hooks/useTadaCompleteMissionMutation";
import useTadaMissionsQuery from "../hooks/useTadaMissionsQuery";
import useTadaStartActivityMutation from "../hooks/useTadaStartActivityMutation";

export default function TadaMissions() {
  const client = useQueryClient();
  const missionsQuery = useTadaMissionsQuery();

  const missions = useMemo(
    () =>
      missionsQuery.data
        ? Object.values(missionsQuery.data).reduce(
            (missions, item) => missions.concat(item),
            []
          )
        : [],
    [missionsQuery.data]
  );

  const completedMissions = useMemo(
    () => missions.filter((item) => item.userClaimedCount === 1),
    [missions]
  );

  const uncompletedMissions = useMemo(
    () => missions.filter((item) => item.userClaimedCount === 0),
    [missions]
  );

  const completeMissionMutation = useTadaCompleteMissionMutation();
  const startActivityMutation = useTadaStartActivityMutation();
  const process = useProcessLock();
  const [currentMission, setCurrentMission] = useState(null);
  const [missionOffset, setMissionOffset] = useState(null);

  const reset = useCallback(() => {
    setCurrentMission(null);
    setMissionOffset(null);
  }, [setCurrentMission, setMissionOffset]);

  /** Handle button click */
  const [handleAutoMissionClick, dispatchAndHandleAutoMissionClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        reset();
        process.toggle();
      }, [reset, process]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "tada.missions.claim",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "tada.missions.claim": () => {
          handleAutoMissionClick();
        },
      }),
      [handleAutoMissionClick]
    )
  );

  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function name() {
      for (let [index, mission] of Object.entries(uncompletedMissions)) {
        setMissionOffset(index);
        setCurrentMission(mission);
        try {
          for (let activity of mission.activityTypes || []) {
            await startActivityMutation.mutateAsync(activity);
            delay(5000);
          }
          await completeMissionMutation.mutateAsync(mission.id);
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      try {
        missionsQuery.refetch();
      } catch {}

      reset();
      process.stop();
    })();
  }, [process]);

  return (
    <div className="p-4">
      {missionsQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      missionsQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch missions...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <div className="flex flex-col p-2 text-black rounded-lg bg-neutral-100">
            <p>
              <span className="font-bold text-blue-500">Missions</span>:{" "}
              <span className="font-bold">{completedMissions.length}</span> /{" "}
              <span className="font-bold">{missions.length}</span>
            </p>
          </div>
          <button
            disabled={process.started}
            onClick={dispatchAndHandleAutoMissionClick}
            className={cn(
              "p-2 rounded-lg disabled:opacity-50",
              process.started
                ? "bg-red-500 text-black"
                : "bg-yellow-500 text-black"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started && currentMission ? (
            <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-100">
              <h4 className="font-bold">
                <span className="text-orange-500">
                  Running Mission{" "}
                  {missionOffset !== null ? +missionOffset + 1 : null}
                </span>
              </h4>
              <h5 className="font-bold">{currentMission.name}</h5>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[completeMissionMutation.status]
                )}
              >
                {completeMissionMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
