import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useCEXBuyOrUpgradeCardMutation from "../hooks/useCEXBuyOrUpgradeCardMutation";
import useCEXCardsQuery from "../hooks/useCEXCardsQuery";
import useCEXGameConfigQuery from "../hooks/useCEXGameConfigQuery";
import useCEXUserQuery from "../hooks/useCEXUserQuery";

export default memo(function CEXCards() {
  const userQuery = useCEXUserQuery();
  const configQuery = useCEXGameConfigQuery();
  const cardsQuery = useCEXCardsQuery();

  const balance = Number(userQuery.data?.["balance_USD"] || 0);

  /** Process */
  const process = useProcessLock("cex.cards");

  /** Card */
  const [currentCard, setCurrentCard] = useState(null);

  /** Buy or Upgrade Card */
  const buyOrUpgradeCardMutation = useCEXBuyOrUpgradeCardMutation();
  /** All Cards */
  const allCards = useMemo(
    () =>
      configQuery.data?.upgradeCardsConfig
        ?.reduce(
          (result, { upgrades, ...category }) =>
            result.concat(
              upgrades.map((item) => {
                /** User Data */
                const userData = cardsQuery.data?.cards?.[item.upgradeId];

                /** Current Level */
                const currentLevel = userData?.lvl || 0;

                /** Next Level */
                const nextLevel = currentLevel + 1;

                /** Current Level */
                const currentLevelData =
                  item.levels[userData ? userData.lvl - 1 : -1] || null;

                /** Next Level */
                const nextLevelData =
                  item.levels[item.levels.indexOf(currentLevelData) + 1] ||
                  null;

                return {
                  ...item,
                  ...category,
                  image: `https://app.cexptap.com/img/upgrades/${category.categoryId}/${item.upgradeId}.png`,
                  userData,
                  currentLevel,
                  currentLevelData,
                  nextLevel,
                  nextLevelData,
                };
              })
            ),
          []
        )
        ?.map((item, index, list) => {
          const dependencyCard = item.dependency.upgradeId
            ? list.find(
                (entry) => entry.upgradeId === item.dependency.upgradeId
              )
            : null;
          return {
            ...item,
            dependencyCard,
          };
        }) || [],
    [configQuery.data, cardsQuery.data]
  );

  /** Available Cards */
  const availableCards = useMemo(
    () =>
      allCards.filter(
        (card) =>
          card.nextLevelData &&
          card.nextLevelData[0] <= balance &&
          (card.dependency.upgradeId === undefined ||
            card.dependency.level <=
              allCards.find(
                (item) => item.upgradeId === card.dependency.upgradeId
              ).currentLevel)
      ),
    [balance, allCards]
  );

  /** Upgradable Cards */
  const upgradableCards = availableCards;

  /** Level Zero Cards */
  const levelZeroCards = useMemo(
    () => upgradableCards.filter((card) => card.currentLevel === 0),
    [upgradableCards]
  );
  /** Log All Cards */
  useEffect(() => {
    customLogger("CEX ALL CARDS", allCards);
    customLogger("CEX AVAILABLE CARDS", availableCards);
    customLogger("CEX LEVEL ZERO CARDS", levelZeroCards);
  }, [allCards, availableCards, levelZeroCards]);

  /** Reset Card */
  useEffect(() => {
    setCurrentCard(null);
  }, [process.started]);

  /** Auto-Upgrade */
  useEffect(() => {
    if (!process.canExecute) return;

    if (!upgradableCards.length) {
      process.stop();

      return;
    }

    (async function () {
      /** Lock */
      process.lock();

      /** Choose Collection */
      const collection = levelZeroCards.length
        ? levelZeroCards
        : upgradableCards;

      /** Pick Random Card */
      const card = collection[Math.floor(Math.random() * collection.length)];

      /** Set Card */
      setCurrentCard(card);

      try {
        /** Buy or Upgrade */
        await buyOrUpgradeCardMutation.mutateAsync({
          categoryId: card.categoryId,
          upgradeId: card.upgradeId,
          nextLevel: card.nextLevel,
          cost: card.nextLevelData[0],
          ccy: card.nextLevelData[1],
          effect: card.nextLevelData[2],
          effectCcy: card.nextLevelData[3],
        });

        /** Refetch */
        await cardsQuery.refetch();
        await userQuery.refetch();
      } catch {}

      /** Delay */
      await delay(2000);

      /** Unlock */
      process.unlock();
    })();
  }, [process, upgradableCards, levelZeroCards]);

  /** Auto-Upgrade */
  useFarmerAutoProcess(
    "cards",
    [
      /** Status */
      userQuery.isLoading,
      cardsQuery.isLoading,
      configQuery.isLoading,
    ].every((status) => status === false),
    process
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 rounded-lg text-white font-bold",
          !process.started ? "bg-orange-500" : "bg-red-500"
        )}
      >
        {!process.started ? "Start Upgrading" : "Stop Upgrading"}
      </button>

      {process.started && currentCard ? (
        <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
          <>
            <div className="flex gap-2">
              <img
                src={currentCard.image}
                className="w-10 h-10 rounded-full shrink-0"
              />
              <div className="flex flex-col min-w-0 min-h-0 grow">
                <h2 className="font-bold">{currentCard.upgradeName}</h2>
                <p className="font-bold">
                  LVL:{" "}
                  <span className="text-red-500">
                    {currentCard.currentLevel || 0}
                  </span>{" "}
                  {">>>"}{" "}
                  <span className="text-green-500">
                    {currentCard.nextLevel}
                  </span>
                </p>
              </div>
            </div>
            <p>
              {buyOrUpgradeCardMutation.isPending ? (
                <span className="text-yellow-500">Upgrading Card...</span>
              ) : buyOrUpgradeCardMutation.isError ? (
                <span className="text-red-500">Failed to Upgrade Card...</span>
              ) : buyOrUpgradeCardMutation.isSuccess ? (
                <span className="font-bold text-green-500">
                  Card Upgraded. (Delaying...)
                </span>
              ) : null}
            </p>
          </>
        </div>
      ) : null}
    </div>
  );
});
