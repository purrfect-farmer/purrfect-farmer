import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import usePumpadCheckMissionMutation from "../hooks/usePumpadCheckMissionMutation";
import usePumpadMissionsQuery from "../hooks/usePumpadMissionsQuery";
import { useEffect } from "react";
import usePumpadGetChannelMutation from "../hooks/usePumpadGetChannelMutation";
import useFarmerContext from "@/hooks/useFarmerContext";
import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";

export default function PumpadMissions() {
  const { processNextTask } = useFarmerContext();
  const queryClient = useQueryClient();
  const missionsQuery = usePumpadMissionsQuery();
  const missions = useMemo(
    () =>
      missionsQuery.data
        ? missionsQuery.data["mission_list"].map((item) => ({
            ...item["mission"],
            ["done_time"]: item["done_time"],
          }))
        : [],
    [missionsQuery.data]
  );

  const process = useProcessLock("pumpad.missions.check");
  const getChannelMutation = usePumpadGetChannelMutation();
  const checkMissionMutation = usePumpadCheckMissionMutation();
  const [currentMission, setCurrentMission] = useState(null);
  const [missionOffset, setMissionOffset] = useState(null);

  const reset = useCallback(() => {
    setCurrentMission(null);
    setMissionOffset(null);
  }, [setCurrentMission, setMissionOffset]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      for (let [index, mission] of Object.entries(missions)) {
        if (process.signal.aborted) break;
        setMissionOffset(index);
        setCurrentMission(mission);
        try {
          if (mission["sub_type"] === "PUMPAD_CHANNEL") {
            const channelId = await getChannelMutation.mutateAsync(mission.id);

            await checkMissionMutation.mutateAsync({
              id: mission.id,
              data: {
                ["tg_channel_id"]: channelId,
              },
            });
          } else {
            await checkMissionMutation.mutateAsync({
              id: mission.id,
            });
          }
        } catch {}

        /** Delay */
        await delay(5_000);
      }

      try {
        await queryClient.refetchQueries({
          queryKey: ["pumpad"],
        });
      } catch {}

      process.stop();
      processNextTask();
    })();
  }, [process, processNextTask]);

  /** Auto-Complete Missions */
  useFarmerAutoTask(
    "missions",
    () => {
      if (missionsQuery.isSuccess) {
        process.start();
      }
    },
    [missionsQuery.isSuccess, process.start]
  );

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
              <span className="font-bold text-orange-700">Missions</span>:{" "}
              <span className="font-bold">{missions.length}</span>
            </p>
          </div>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 rounded-lg disabled:opacity-50",
              process.started
                ? "bg-red-500 text-black"
                : "bg-pumpad-green-500 text-black"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started && currentMission ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-800">
              <h4 className="font-bold">
                <span className="text-yellow-500">
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
                  }[checkMissionMutation.status]
                )}
              >
                {checkMissionMutation.status}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
