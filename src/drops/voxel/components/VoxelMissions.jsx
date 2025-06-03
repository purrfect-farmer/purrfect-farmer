import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useVoxelUserQuery from "../hooks/useVoxelUserQuery";
import useVoxelVerifyMissionMutation from "../hooks/useVoxelVerifyMissionMutation";

export default memo(function VoxelMissions() {
  const { joinTelegramLink } = useFarmerContext();
  const queryClient = useQueryClient();
  const userQuery = useVoxelUserQuery();
  const verifyMissionMutation = useVoxelVerifyMissionMutation();

  const user = userQuery.data?.user;
  const allMissions = useMemo(
    () => (userQuery.data ? userQuery.data.configuration.Missions : []),
    [userQuery.data]
  );

  const missions = useMemo(
    () =>
      allMissions.filter(
        (item) =>
          item.Enabled &&
          ["socials", "partners"].includes(item.Group) &&
          !(item.ID in user.MissionsData)
      ),
    [user, allMissions]
  );

  const process = useProcessLock("voxel.missions");
  const [currentMission, setCurrentMission] = useState(null);
  const [missionOffset, setMissionOffset] = useState(null);

  const reset = useCallback(() => {
    setCurrentMission(null);
    setMissionOffset(null);
  }, [setCurrentMission, setMissionOffset]);

  /** Log */
  useEffect(() => {
    customLogger("VOXEL ALL MISSIONS", allMissions);
    customLogger("VOXEL AVAILABLE MISSIONS", missions);
  }, [allMissions, missions]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute the Process */
    process.execute(async function () {
      for (let [index, mission] of Object.entries(missions)) {
        if (process.controller.signal.aborted) return;
        setMissionOffset(index);
        setCurrentMission(mission);
        try {
          /** Join Link */
          if (canJoinTelegramLink(mission.StartLink)) {
            await joinTelegramLink(mission.StartLink);
          }

          await verifyMissionMutation.mutateAsync(mission.ID);
        } catch (e) {
          console.error(e);
        }

        /** Delay */
        await delay(3_000);
      }

      try {
        await queryClient.refetchQueries({
          queryKey: ["voxel"],
        });
      } catch (e) {
        console.error(e);
      }

      /** Stop */
      return true;
    });
  }, [process, joinTelegramLink]);

  /** Auto-Complete Missions */
  useFarmerAutoProcess("missions", process, [userQuery.isLoading === false]);

  return (
    <>
      {userQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : // Error
      userQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch missions...
        </div>
      ) : (
        // Success
        <div className="flex flex-col gap-2">
          <div className="flex flex-col p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700">
            <p>
              <span className="font-bold text-orange-700 dark:text-orange-500">
                Missions
              </span>
              : <span className="font-bold">{missions.length}</span>
            </p>
          </div>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 rounded-lg disabled:opacity-50",
              process.started
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started && currentMission ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
              {/* Mission Details */}
              <div className="flex gap-2">
                <img src={currentMission.Icon} className="size-10" />
                <div className="grow flex flex-col gap-2">
                  <h4 className="font-bold">
                    <span className="text-yellow-500">
                      Running Mission{" "}
                      {missionOffset !== null ? +missionOffset + 1 : null}
                    </span>
                  </h4>
                  <h5 className="font-bold">{currentMission.Description.EN}</h5>
                  <p
                    className={cn(
                      "capitalize",
                      {
                        success: "text-green-500",
                        error: "text-red-500",
                      }[verifyMissionMutation.status]
                    )}
                  >
                    {verifyMissionMutation.status}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
});
