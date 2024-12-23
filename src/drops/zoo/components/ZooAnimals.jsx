import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay, logNicely } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useZooBuyAnimalMutation from "../hooks/useZooBuyAnimalMutation";
import useZooDataQueries from "../hooks/useZooDataQueries";

export default memo(function ZooAnimals() {
  const queryClient = useQueryClient();
  const dataQueries = useZooDataQueries();
  const [allData] = dataQueries.data;
  const hero = allData.hero;
  const balance = hero.coins;

  /** Process */
  const process = useProcessLock("zoo.animals");

  /** Animal */
  const [currentAnimal, setCurrentAnimal] = useState(null);

  /** Buy Animal Mutation */
  const buyAnimalMutation = useZooBuyAnimalMutation();

  /** All Animals */
  const allAnimals = useMemo(
    () =>
      allData.dbData.dbAnimals.map((animal) => ({
        ...animal,
        icon: `https://game.zoo.team/assets/img/animals/${animal.key}.png`,
      })),
    [allData]
  );

  /** User Animals */
  const userAnimals = useMemo(
    () =>
      allData.animals.map((animal) => ({
        ...animal,
        ...allAnimals.find((item) => item.key === animal.key),
      })),
    [allData, allAnimals]
  );

  /** New Animals */
  const newAnimals = useMemo(
    () =>
      allAnimals
        .filter(
          (animal) =>
            userAnimals.some((item) => item.key === animal.key) === false &&
            animal.levels[0].price <= balance
        )
        .sort((a, b) => b.levels[0].price - a.levels[0].price),
    [balance, allAnimals, userAnimals]
  );

  /** Upgradable Animals */
  const upgradableAnimals = useMemo(
    () =>
      userAnimals.filter((item) => {
        const animal = allAnimals.find((entry) => entry.key === item.key);
        const levels = animal.levels;
        const currentLevelIndex = levels.findIndex(
          (entry) => entry.level === item.level
        );
        const nextLevel = levels[currentLevelIndex + 1];

        return nextLevel && nextLevel.price <= balance;
      }),
    [balance, allAnimals, userAnimals]
  );

  /** Positions */
  const positions = useMemo(
    () =>
      Object.keys(Array(allAnimals.length + 1).fill())
        .slice(1)
        .map(Number),
    [allAnimals.length]
  );

  /** Used Positions */
  const usedPositions = useMemo(
    () => userAnimals.map((animal) => animal.position),
    [userAnimals]
  );

  /** Available Positions */
  const availablePositions = useMemo(
    () => positions.filter((item) => usedPositions.includes(item) === false),
    [positions, usedPositions]
  );

  /** Log All Animals */
  useEffect(() => {
    logNicely("ZOO ALL ANIMALS", allAnimals);
    logNicely("ZOO USER ANIMALS", userAnimals);
    logNicely("ZOO NEW ANIMALS", newAnimals);
    logNicely("ZOO UPGRADABLE ANIMALS", upgradableAnimals);
  }, [allAnimals, userAnimals, newAnimals, upgradableAnimals]);

  /** Log All Positions */
  useEffect(() => {
    logNicely("ZOO ALL POSITIONS", positions);
    logNicely("ZOO USED POSITIONS", usedPositions);
    logNicely("ZOO AVAILABLE POSITIONS", availablePositions);
  }, [positions, usedPositions, availablePositions]);

  /** Reset Animal */
  useEffect(() => {
    setCurrentAnimal(null);
  }, [process.started]);

  /** Auto-Upgrade */
  useEffect(() => {
    if (!process.canExecute) return;

    if (!newAnimals.length && !upgradableAnimals.length) {
      process.stop();

      return;
    }

    (async function () {
      /** Lock */
      process.lock();

      /** Choose Collection */
      const collection = newAnimals.length ? newAnimals : upgradableAnimals;

      /** Pick Random Animal */
      const animal = collection[Math.floor(Math.random() * collection.length)];

      /** Pick Random Position */
      const position =
        availablePositions[
          Math.floor(Math.random() * availablePositions.length)
        ];

      /** Set Animal */
      setCurrentAnimal(animal);

      try {
        /** Level Up */
        const result = await buyAnimalMutation.mutateAsync({
          animalKey: animal.key,
          position: animal.position || position,
        });

        /** Update Data */
        queryClient.setQueryData(["zoo", "all"], (prev) => {
          return {
            ...prev,
            ...result,
          };
        });
      } catch {}

      /** Delay */
      await delay(2000);

      /** Unlock */
      process.unlock();
    })();
  }, [process, newAnimals, upgradableAnimals]);

  /** Auto-Upgrade */
  useFarmerAutoProcess("animals", true, process);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "w-full px-4 py-2 uppercase rounded-full",
          "disabled:opacity-50",
          !process.started ? "bg-yellow-500" : "bg-red-500"
        )}
      >
        {!process.started ? "Start Upgrading" : "Stop Upgrading"}
      </button>

      {process.started && currentAnimal ? (
        <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-800">
          <>
            <div className="flex items-center gap-2">
              <img
                src={currentAnimal["icon"]}
                className="w-10 h-10 rounded-full shrink-0"
              />
              <div className="flex flex-col min-w-0 min-h-0 grow">
                <h2 className="font-bold">{currentAnimal["title"]}</h2>
                <p>
                  {buyAnimalMutation.isPending ? (
                    <span className="text-yellow-500">Upgrading Animal...</span>
                  ) : buyAnimalMutation.isError ? (
                    <span className="text-red-500">
                      Failed to Upgrade Animal...
                    </span>
                  ) : buyAnimalMutation.isSuccess ? (
                    <span className="font-bold text-green-500">
                      Animal Upgraded. (Delaying...)
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
          </>
        </div>
      ) : null}
    </div>
  );
});
