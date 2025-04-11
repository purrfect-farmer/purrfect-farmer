import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useSpaceAdventureBoostsQuery from "../hooks/useSpaceAdventureBoostsQuery";
import useSpaceAdventureBuyBoostMutation from "../hooks/useSpaceAdventureBuyBoostMutation";
import useSpaceAdventureUserQuery from "../hooks/useSpaceAdventureUserQuery";

export default memo(function SpaceAdventureBoosts() {
  const queryClient = useQueryClient();

  /** Process */
  const process = useProcessLock("space-adventure.boosts");

  const userQuery = useSpaceAdventureUserQuery();
  const boostsQuery = useSpaceAdventureBoostsQuery();

  /** Update User */
  const updateUser = useCallback(
    (user) =>
      queryClient.setQueryData(["space-adventure", "user"], (prev) => ({
        ...prev,
        user,
      })),
    [queryClient.setQueryData]
  );

  /** Update Boost */
  const updateBoost = useCallback(
    (id) =>
      queryClient.setQueryData(["space-adventure", "boosts"], (prev) => ({
        ...prev,
        list: prev.list.map((item) =>
          item.id === id
            ? { ...item, ["level_current"]: item["level_current"] + 1 }
            : item
        ),
      })),
    [queryClient.setQueryData]
  );

  const user = userQuery.data?.user;
  const balance = Number(user?.["balance"] || 0);
  const gems = Number(user?.["gems"] || 0);

  const buyBoostMutation = useSpaceAdventureBuyBoostMutation();

  const boosts = useMemo(
    () => boostsQuery.data?.list || [],
    [boostsQuery.data]
  );

  /** Boost */
  const [currentBoost, setCurrentBoost] = useState(null);

  const levelBoosts = useMemo(
    () =>
      boosts
        .filter((item) => item["type"] === "level_boost")
        .map((item) => ({
          ...item,
          ["next_level"]: item["level_list"][item["level_current"] + 1],
        })),
    [boosts]
  );

  /** Current Max Level */
  const currentMaxLevel = useMemo(
    () => Math.max(...levelBoosts.map((item) => item["level_current"])),
    [levelBoosts]
  );

  /** Is Same Level */
  const isSameLevel = useMemo(
    () =>
      levelBoosts.every((item) => item["level_current"] === currentMaxLevel),
    [levelBoosts, currentMaxLevel]
  );

  /** Available Boosts */
  const availableBoosts = useMemo(
    () =>
      levelBoosts.filter(
        (item) =>
          item["next_level"] &&
          (item["next_level"]["price_coin"] <= balance ||
            item["next_level"]["price_gems"] <= gems)
      ),
    [levelBoosts, balance, gems]
  );

  /** Upgradable Boosts */
  const upgradableBoosts = useMemo(
    () =>
      availableBoosts.filter(
        (item) => isSameLevel || item["level_current"] < currentMaxLevel
      ),
    [availableBoosts, isSameLevel, currentMaxLevel]
  );

  /** Log All Boosts */
  useEffect(() => {
    customLogger("SPACE-ADVENTURE ALL BOOSTS", boosts);
    customLogger("SPACE-ADVENTURE LEVEL BOOSTS", levelBoosts);
    customLogger("SPACE-ADVENTURE AVAILABLE BOOSTS", availableBoosts);
    customLogger("SPACE-ADVENTURE UPGRADABLE BOOSTS", upgradableBoosts);
    customLogger("SPACE-ADVENTURE BOOSTS SAME-LEVEL", isSameLevel);
    customLogger("SPACE-ADVENTURE BOOSTS CURRENT-MAX-LEVEL", currentMaxLevel);
  }, [
    /** Deps */
    boosts,
    levelBoosts,
    availableBoosts,
    upgradableBoosts,
    isSameLevel,
    currentMaxLevel,
  ]);

  /** Reset Boost */
  useEffect(() => {
    setCurrentBoost(null);
  }, [process.started]);

  /** Auto-Upgrade */
  useEffect(() => {
    if (!process.canExecute) return;

    if (!upgradableBoosts.length) {
      process.stop();

      return;
    }

    process.execute(async function () {
      /** Choose Collection */
      const collection = upgradableBoosts;

      /** Pick Boost */
      const selected =
        collection[Math.floor(Math.random() * collection.length)];

      /** Method */
      const method =
        selected["next_level"]["price_gems"] <= gems ? "gems" : "coin";

      /** Set Boost */
      setCurrentBoost(selected);

      try {
        /** Buy Boost */
        const { user } = await buyBoostMutation.mutateAsync({
          id: selected.id,
          method,
        });

        /** Update User */
        updateUser(user);

        /** Update Boost */
        updateBoost(selected.id);
      } catch (e) {
        console.error(e);
      }

      /** Delay */
      await delay(2000);
    });
  }, [process, gems, upgradableBoosts, updateUser, updateBoost]);

  /** Auto-Upgrade */
  useFarmerAutoProcess("boosts", process, [
    userQuery.isLoading === false,
    boostsQuery.isLoading === false,
  ]);

  return (
    <div className="flex flex-col gap-2 p-4">
      {boostsQuery.isPending ? (
        <p className="text-center text-orange-500">Loading...</p>
      ) : boostsQuery.isError ? (
        <p className="text-center text-red-500">Error...</p>
      ) : (
        <>
          <h3 className="text-purple-500 font-bold text-center">
            CURRENT LEVEL: {currentMaxLevel}
          </h3>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "px-4 py-2 rounded-lg text-white font-bold",
              !process.started ? "bg-purple-500" : "bg-red-500"
            )}
          >
            {!process.started ? "Start Upgrading" : "Stop Upgrading"}
          </button>

          {process.started && currentBoost ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
              <>
                <div className="flex gap-2">
                  <img
                    key={currentBoost["id"]}
                    src={
                      "https://space-adventure.online/" + currentBoost["icon"]
                    }
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                  <div className="flex flex-col min-w-0 min-h-0 grow">
                    <h2 className="font-bold uppercase">
                      {currentBoost["level_type"]}
                    </h2>
                    <p className="font-bold">
                      LVL:{" "}
                      <span className="text-red-500">
                        {currentBoost["level_current"]}
                      </span>{" "}
                      {">>>"}{" "}
                      <span className="text-green-500">
                        {currentBoost["level_current"] + 1}
                      </span>
                    </p>
                  </div>
                </div>
                <p>
                  {buyBoostMutation.isPending ? (
                    <span className="text-yellow-500">Upgrading Boost...</span>
                  ) : buyBoostMutation.isError ? (
                    <span className="text-red-500">
                      Failed to Upgrade Boost...
                    </span>
                  ) : buyBoostMutation.isSuccess ? (
                    <span className="font-bold text-green-500">
                      Boost Upgraded. (Delaying...)
                    </span>
                  ) : null}
                </p>
              </>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
});
