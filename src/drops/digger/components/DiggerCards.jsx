import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import useDiggerBuyCardMutation from "../hooks/useDiggerBuyCardMutation";
import useDiggerCardsQuery from "../hooks/useDiggerCardsQuery";
import useDiggerUserQuery from "../hooks/useDiggerUserQuery";

export default memo(function DiggerCards() {
  const queryClient = useQueryClient();

  /** Process */
  const process = useProcessLock("digger.cards");

  const userQuery = useDiggerUserQuery();
  const cardsQuery = useDiggerCardsQuery();

  const balance = userQuery.data?.["coin_cnt"] || 0;
  const buyCardMutation = useDiggerBuyCardMutation();

  const cards = useMemo(() => cardsQuery.data || [], [cardsQuery.data]);

  /** Card */
  const [currentCard, setCurrentCard] = useState(null);

  /** Upgradable Cards */
  const upgradableCards = useMemo(
    () =>
      cards.filter(
        (card) => card["next_level"] && card["next_level"]["price"] <= balance
      ),
    [balance, cards]
  );

  /** Level Zero Cards */
  const levelZeroCards = useMemo(
    () => upgradableCards.filter((item) => !item["cur_level"]),
    [upgradableCards]
  );

  /** Log All Cards */
  useEffect(() => {
    customLogger("DIGGER ALL CARDS", cards);
    customLogger("DIGGER UPGRADABLE CARDS", upgradableCards);
    customLogger("DIGGER LEVEL ZERO CARDS", levelZeroCards);
  }, [cards, upgradableCards, levelZeroCards]);

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

    process.execute(async function () {
      /** Choose Collection */
      const collection = levelZeroCards.length
        ? levelZeroCards
        : upgradableCards;

      /** Pick First Card */
      const selected =
        collection[Math.floor(Math.random() * collection.length)];

      /** Set Card */
      setCurrentCard(selected);

      try {
        /** Buy Card */
        await buyCardMutation.mutateAsync(selected.card.id);
      } catch {}

      try {
        /** Refetch */
        await cardsQuery.refetch();
        await userQuery.refetch();
      } catch {}

      /** Delay */
      await delay(2000);
    });
  }, [process, upgradableCards, levelZeroCards]);

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
              !process.started ? "bg-green-500" : "bg-red-500"
            )}
          >
            {!process.started ? "Start Upgrading" : "Stop Upgrading"}
          </button>

          {process.started && currentCard ? (
            <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
              <>
                <div className="flex gap-2">
                  <img
                    src={currentCard.card["art_url"]}
                    className="w-10 h-10 rounded-full shrink-0"
                  />
                  <div className="flex flex-col min-w-0 min-h-0 grow">
                    <h2 className="font-bold">{currentCard.card.title}</h2>
                    <p className="font-bold">
                      LVL:{" "}
                      <span className="text-red-500">
                        {currentCard["cur_level"]?.["level"] || 0}
                      </span>{" "}
                      {">>>"}{" "}
                      <span className="text-green-500">
                        {currentCard["next_level"]?.["level"]}
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
