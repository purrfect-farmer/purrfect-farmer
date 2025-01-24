import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, customLogger, delay } from "@/lib/utils";
import { isAfter, isBefore } from "date-fns";
import { memo, useCallback } from "react";
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
  const tph = hero?.tph || 0;

  const instantItemPriceInTph =
    allData?.dbData?.dbAutoFeed?.find((item) => item.key === "instant")
      ?.priceInTph || 0;

  const feedPrice = Math.ceil(tph * instantItemPriceInTph);

  /** Process */
  const process = useProcessLock("zoo.animals");

  /** Animal */
  const [currentAnimal, setCurrentAnimal] = useState(null);

  /** Buy Animal Mutation */
  const buyAnimalMutation = useZooBuyAnimalMutation();

  /** Can Purchase Animal */
  const canPurchaseAnimal = useCallback(
    (price) => balance - price >= feedPrice,
    [balance, feedPrice]
  );

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
      allData.animals.map((item) => {
        const animal = allAnimals.find((entry) => entry.key === item.key);
        const levels = animal.levels;
        const currentLevel = levels.find((entry) => entry.level === item.level);
        const currentLevelIndex = levels.findIndex(
          (entry) => entry.level === item.level
        );
        const nextLevel = levels[currentLevelIndex + 1];

        const nextProfitDifference = nextLevel
          ? nextLevel.profit - currentLevel.profit
          : 0;

        return {
          ...item,
          ...animal,
          currentLevel,
          nextLevel,
          nextProfitDifference,
        };
      }),
    [allData, allAnimals]
  );

  /** New Animals */
  const newAnimals = useMemo(
    () =>
      allAnimals
        .filter(
          (animal) =>
            /** Exists */
            userAnimals.some((item) => item.key === animal.key) === false &&
            /** Price */
            canPurchaseAnimal(animal.levels[0].price) &&
            /** Date Start */
            (animal.dateStart === null ||
              isAfter(new Date(), new Date(animal.dateStart))) &&
            /** Date End */
            (animal.dateEnd === null ||
              isBefore(new Date(), new Date(animal.dateEnd)))
        )
        .sort((a, b) => {
          return b.levels[0].profit - a.levels[0].profit;
        }),
    [allAnimals, userAnimals, canPurchaseAnimal]
  );

  /** Upgradable Animals */
  const upgradableAnimals = useMemo(
    () =>
      userAnimals
        .filter((item) => {
          return item.nextLevel && canPurchaseAnimal(item.nextLevel.price);
        })
        .sort((a, b) => {
          return b.nextProfitDifference - a.nextProfitDifference;
        }),
    [userAnimals, canPurchaseAnimal]
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
    customLogger("ZOO ALL ANIMALS", allAnimals);
    customLogger("ZOO USER ANIMALS", userAnimals);
    customLogger("ZOO NEW ANIMALS", newAnimals);
    customLogger("ZOO UPGRADABLE ANIMALS", upgradableAnimals);
  }, [allAnimals, userAnimals, newAnimals, upgradableAnimals]);

  /** Log All Positions */
  useEffect(() => {
    customLogger("ZOO ALL POSITIONS", positions);
    customLogger("ZOO USED POSITIONS", usedPositions);
    customLogger("ZOO AVAILABLE POSITIONS", availablePositions);
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

    /** Execute */
    process.execute(async function () {
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
    });
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
