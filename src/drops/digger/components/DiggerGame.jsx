import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { CgSpinner } from "react-icons/cg";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import useDiggerChestsQuery from "../hooks/useDiggerChestsQuery";
import useDiggerTapMutation from "../hooks/useDiggerTapMutation";
import useDiggerUserQuery from "../hooks/useDiggerUserQuery";

export default memo(function DiggerGame() {
  const process = useProcessLock("digger.game");
  const queryClient = useQueryClient();
  const userQuery = useDiggerUserQuery();
  const chestsQuery = useDiggerChestsQuery();
  const tapMutation = useDiggerTapMutation();

  const chests = useMemo(
    () =>
      chestsQuery.data
        ?.filter((item) => item.status === "progress")
        .sort((a, b) => b.chest.id - a.chest.id),
    [chestsQuery.data]
  );

  const currentChest = chests?.[0];
  const uid = currentChest?.uid;
  const maxCount = currentChest?.["open_tap_cnt"] || 0;
  const currentCount = currentChest?.["current_tap_cnt"] || 0;
  const energy = maxCount - currentCount;

  /** Auto Game */
  useEffect(() => {
    if (!process.canExecute) return;

    if (energy < 1) {
      process.stop();
      return;
    }

    /** Execute */
    process.execute(async function () {
      try {
        /** Calculate Amount to Collect */
        const taps = Math.min(energy, 10);

        /** Tap */
        const result = await tapMutation.mutateAsync({
          cnt: taps,
          uid,
        });

        /** Update User */
        queryClient.setQueryData(["digger", "user"], (prev) => ({
          ...prev,
          ...result["user_state"],
          ["coin_cnt"]: result["coin_cnt"],
          ["level_info"]: result["level_info"],
        }));

        /** Toast */
        toast.dismiss();
        toast.success(`Collected ${taps} taps!`);

        /** Toast Success */
        if (result["user_chest"]) {
          await toast.promise(delay(2000, true), {
            loading: "Opening - " + currentChest.chest.title,
            success: "Opened - " + currentChest.chest.title,
            error: "Failed to Open Chest",
          });
        }

        /** Update Chests */
        queryClient.setQueryData(["digger", "chests"], (prev) =>
          prev.map((item) =>
            item.uid === uid
              ? {
                  ...item,
                  ...result["user_chest"],
                  ["current_tap_cnt"]: result["current_tap_cnt"],
                }
              : item
          )
        );
      } catch {}

      /** Delay */
      await delay(500);
    });
  }, [process, uid, energy]);

  /** Auto-Game */
  useFarmerAutoProcess(
    "game",
    [userQuery.isLoading, chestsQuery.isLoading].every(
      (status) => status === false
    ),
    process
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      {chestsQuery.isSuccess ? (
        <>
          {currentChest ? (
            <div className="flex gap-2 bg-black text-white p-2 rounded-lg">
              <img
                src={currentChest.chest["art_url"]}
                className="size-10 shrink-0"
              />
              <div className="grow min-w-0 flex flex-col">
                <h3 className="font-bold">{currentChest.chest["title"]}</h3>
                <p className="text-purple-500">UID: {uid}</p>
              </div>
            </div>
          ) : null}
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "px-4 py-2 rounded-lg text-white font-bold",
              !process.started ? "bg-green-500" : "bg-red-500"
            )}
          >
            {!process.started ? "Start Playing" : "Stop Playing"}
          </button>

          {/* Energy */}
          <div className="font-bold text-center text-green-500">
            Energy: {energy}
          </div>
        </>
      ) : (
        <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
      )}
    </div>
  );
});
