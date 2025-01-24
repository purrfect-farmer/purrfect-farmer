import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, customLogger, delay } from "@/lib/utils";
import { isAfter } from "date-fns";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useBattleBullsBuyCardMutation from "../hooks/useBattleBullsBuyCardMutation";
import useBattleBullsCardsQuery from "../hooks/useBattleBullsCardsQuery";
import useBattleBullsUserQuery from "../hooks/useBattleBullsUserQuery";

export default memo(function BattleBullsCards() {
  const queryClient = useQueryClient();

  /** Process */
  const process = useProcessLock("battle-bulls.cards");

  const userQuery = useBattleBullsUserQuery();
  const cardsQuery = useBattleBullsCardsQuery();

  const balance = userQuery.data?.balance || 0;
  const buyCardMutation = useBattleBullsBuyCardMutation();

  const cards = useMemo(
    () =>
      cardsQuery.data?.map((card) => ({
        ...card,
        icon: `https://tg.battle-games.com/bull-cards/${card.id}.png?1`,
      })) || [],
    [cardsQuery.data]
  );

  /** Card */
  const [currentCard, setCurrentCard] = useState(null);

  /** Validate Card Availability */
  const validateCardAvailability = useCallback(
    (card) =>
      card.boughtAt === null ||
      card.rechargingDuration === 0 ||
      isAfter(new Date(), new Date(card.boughtAt + card.rechargingDuration)),
    []
  );

  /** Validate Card Condition */
  const validateCardCondition = useCallback(
    (item) => item.condition === null || item.condition.passed,
    []
  );

  /** Available Cards */
  const availableCards = useMemo(
    () =>
      cards.filter((card) => card.available && card.nextLevel.cost <= balance),
    [balance, cards]
  );

  /** Upgradable Cards */
  const upgradableCards = useMemo(
    () =>
      availableCards
        .filter(
          (item) =>
            validateCardCondition(item) && validateCardAvailability(item)
        )
        .sort((a, b) => {
          return (
            b.nextLevel.profitPerHourDelta - a.nextLevel.profitPerHourDelta
          );
        }),
    [availableCards, validateCardCondition, validateCardAvailability]
  );

  /** Level Zero Cards */
  const levelZeroCards = useMemo(
    () => upgradableCards.filter((item) => item.level === 0),
    [upgradableCards]
  );

  /** Required Cards */
  const requiredCards = useMemo(
    () =>
      upgradableCards.filter((item) =>
        availableCards.some(
          (card) =>
            item.id === card.condition?.cardId &&
            item.level < card.condition?.level
        )
      ),
    [availableCards, upgradableCards]
  );

  /** Log All Cards */
  useEffect(() => {
    customLogger("BATTLE BULLS ALL CARDS", cards);
    customLogger("BATTLE BULLS AVAILABLE CARDS", availableCards);
    customLogger("BATTLE BULLS UPGRADABLE CARDS", upgradableCards);
    customLogger("BATTLE BULLS LEVEL ZERO CARDS", levelZeroCards);
    customLogger("BATTLE BULLS REQUIRED CARDS", requiredCards);
  }, [cards, availableCards, upgradableCards, levelZeroCards, requiredCards]);

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
        : requiredCards.length
        ? requiredCards
        : upgradableCards;

      /** Pick First Card */
      const card = collection[Math.floor(Math.random() * collection.length)];

      /** Set Card */
      setCurrentCard(card);

      try {
        /** Buy Card */
        const result = await buyCardMutation.mutateAsync(card.id);

        /** Update User */
        queryClient.setQueryData(["battle-bulls", "user"], () => result.user);

        /** Update Tasks */
        queryClient.setQueryData(["battle-bulls", "cards"], () => result.cards);
      } catch {}

      /** Delay */
      await delay(2000);

      /** Unlock */
      process.unlock();
    })();
  }, [process, upgradableCards, levelZeroCards, requiredCards]);

  /** Auto-Upgrade */
  useFarmerAutoProcess(
    "cards",
    [cardsQuery.isLoading].every((status) => status === false),
    process
  );

  return (
    <div className="flex flex-col gap-2 p-4">
      {cardsQuery.isPending ? (
        <p className="text-center text-orange-500">Loading...</p>
      ) : cardsQuery.isError ? (
        <p className="text-center text-red-500">Error...</p>
      ) : (
        <>
          <button
            onClick={() => process.dispatchAndToggle(!process.started)}
            className={cn(
              "px-4 py-2 rounded-lg text-white font-bold",
              !process.started ? "bg-blue-500" : "bg-red-500"
            )}
          >
            {!process.started ? "Start Upgrading" : "Stop Upgrading"}
          </button>

          {process.started && currentCard ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
              <>
                <div className="flex gap-2">
                  <img
                    src={currentCard.icon}
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                  <div className="flex flex-col min-w-0 min-h-0 grow">
                    <h2 className="font-bold">
                      {currentCard.id.toUpperCase()}
                    </h2>
                    <p className="font-bold">
                      LVL:{" "}
                      <span className="text-red-500">{currentCard.level}</span>{" "}
                      {">>>"}{" "}
                      <span className="text-green-500">
                        {currentCard.level + 1}
                      </span>
                    </p>
                  </div>
                </div>
                <p>
                  {buyCardMutation.isPending ? (
                    <span className="text-yellow-500">Upgrading Card...</span>
                  ) : buyCardMutation.isError ? (
                    <span className="text-red-500">
                      Failed to Upgrade Card...
                    </span>
                  ) : buyCardMutation.isSuccess ? (
                    <span className="font-bold text-green-500">
                      Card Upgraded. (Delaying...)
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
