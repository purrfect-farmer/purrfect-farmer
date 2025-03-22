import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useDiggerChestStatusQuery from "../hooks/useDiggerChestStatusQuery";
import useDiggerChestsQuery from "../hooks/useDiggerChestsQuery";
import useDiggerIntentMutation from "../hooks/useDiggerIntentMutation";
import useDiggerUpdateMutation from "../hooks/useDiggerUpdateMutation";

const CHEST_TYPES = {
  7: "usdt_chest",
  3: "adamant_chest",
  2: "gold_chest",
};

export default function DiggerChests() {
  const process = useProcessLock("digger.chests");
  const chestsQuery = useDiggerChestsQuery();
  const statusQuery = useDiggerChestStatusQuery();
  const availableChests = useMemo(
    () =>
      statusQuery.data?.["chest_statuses"]?.filter(
        (item) =>
          item["remaining_cooldown_sec"] === 0 &&
          item["ads_watched"] < item["ads_required"]
      ),
    [statusQuery.data]
  );

  const intentMutation = useDiggerIntentMutation();
  const updateMutation = useDiggerUpdateMutation();

  const [currentChest, setCurrentChest] = useState(null);

  const reset = useCallback(() => {
    setCurrentChest(null);
  }, [setCurrentChest]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (availableChests.length < 1) {
      /** Stop the process */
      process.stop();
      return;
    }

    /** Execute the Process */
    process.execute(async function () {
      /** Reset */
      intentMutation.reset();
      updateMutation.reset();

      /** Select Chest */
      const selectedChest = availableChests[0];

      /** Set Current Chest */
      setCurrentChest(selectedChest);

      try {
        /** Post Intent */
        const result = await intentMutation.mutateAsync({
          type: CHEST_TYPES[selectedChest["chest_id"]],
          platform: "2",
        });

        /** Delay */
        await delay(10000);

        /** Claim Reward */
        await updateMutation.mutateAsync({
          status: "reward",
          uid: result["uid"],
        });
      } catch {}

      /** Refetch */
      try {
        await chestsQuery.refetch();
        await statusQuery.refetch();
      } catch {}
    });
  }, [process]);

  /** Auto-Complete Points */
  useFarmerAutoProcess(
    "chests",
    [statusQuery.isLoading].every((status) => status === false),
    process
  );

  return (
    <div className="p-4">
      {statusQuery.isPending ? (
        <div className="flex justify-center">Loading...</div>
      ) : /** Error */
      statusQuery.isError ? (
        <div className="flex justify-center text-red-500">
          Failed to fetch chests...
        </div>
      ) : (
        /** Success */
        <div className="flex flex-col gap-2">
          <div className="flex flex-col p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700">
            <p>
              <span className="font-bold text-purple-700 dark:text-purple-500">
                Available Chests
              </span>
              : <span className="font-bold">{availableChests.length}</span>
            </p>
          </div>

          {/* Start / Stop Button */}
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "p-2 rounded-lg disabled:opacity-50",
              "font-bold",
              process.started
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            )}
          >
            {process.started ? "Stop" : "Start"}
          </button>

          {process.started && currentChest ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-black">
              <h5 className="font-bold text-green-500">
                Chest ID: {currentChest["chest_id"]}
              </h5>
              <p
                className={cn(
                  "capitalize",
                  {
                    success: "text-green-500",
                    error: "text-red-500",
                  }[updateMutation.status]
                )}
              >
                {updateMutation.status}{" "}
                {updateMutation.status === "success" ? "(Delaying...)" : null}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
