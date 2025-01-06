import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay, logNicely } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useFunaticBuyOrUpgradeCardMutation from "../hooks/useFunaticBuyOrUpgradeCardMutation";
import useFunaticCardsQuery from "../hooks/useFunaticCardsQuery";
import useFunaticGameQuery from "../hooks/useFunaticGameQuery";

export default memo(function FunaticCards() {
  const gameQuery = useFunaticGameQuery();
  const cardsQuery = useFunaticCardsQuery();

  const balance = gameQuery.data?.funz?.currentFunzBalance || 0;

  /** Process */
  const process = useProcessLock("funatic.cards");

  /** Card */
  const [currentCard, setCurrentCard] = useState(null);

  /** Buy or Upgrade Card */
  const buyOrUpgradeCardMutation = useFunaticBuyOrUpgradeCardMutation();

  /** All Cards */
  const allCards = useMemo(
    () =>
      cardsQuery.data?.map((card) => ({
        ...card,
        image: `https://clicker.funtico.com/_next/image?url=${encodeURIComponent(
          card.image
        )}&w=96&q=75`,
      })) || [],
    [cardsQuery.data]
  );

  /** Available Cards */
  const availableCards = useMemo(
    () =>
      allCards.filter(
        (card) =>
          card.buyOrUpgradeCost <= balance &&
          card.buyOrUpgradeRequirements.length === 0 &&
          card.isMaxLevelReached === false &&
          card.isComingSoon === false
      ),
    [balance, allCards]
  );

  /** Upgradable Cards */
  const upgradableCards = availableCards;

  /** Level Zero Cards */
  const levelZeroCards = useMemo(
    () => upgradableCards.filter((card) => card.level === null),
    [upgradableCards]
  );
  /** Log All Cards */
  useEffect(() => {
    logNicely("FUNATIC ALL CARDS", allCards);
    logNicely("FUNATIC AVAILABLE CARDS", availableCards);
    logNicely("FUNATIC LEVEL ZERO CARDS", levelZeroCards);
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
          cardId: card.id,
          isUpgrade: card.level !== null,
        });

        /** Refetch */
        await gameQuery.refetch();
        await cardsQuery.refetch();
      } catch {}

      /** Delay */
      await delay(2000);

      /** Unlock */
      process.unlock();
    })();
  }, [process, upgradableCards, levelZeroCards]);

  /** Auto-Upgrade */
  useFarmerAutoProcess("cards", cardsQuery.isLoading === false, process);

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 rounded-lg text-white font-bold",
          !process.started ? "bg-purple-500" : "bg-red-500"
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
                <h2 className="font-bold">{currentCard.name}</h2>
                <p className="font-bold">
                  LVL:{" "}
                  <span className="text-red-500">{currentCard.level || 0}</span>{" "}
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
