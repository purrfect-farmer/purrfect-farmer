import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay, logNicely } from "@/lib/utils";
import { isAfter, isBefore } from "date-fns";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useTsubasaLevelUpMutation from "../hooks/useTsubasaLevelUpMutation";

export default function TsubasaCards() {
  const { authQuery } = useFarmerContext();
  const user = authQuery.data?.["game_data"]?.["user"];
  const balance = user["total_coins"];
  const friendCount = authQuery.data["friend_count"];

  /** Process */
  const process = useProcessLock("tsubasa.cards");

  /** Card */
  const [currentCard, setCurrentCard] = useState(null);

  /** Level Up */
  const levelUpMutation = useTsubasaLevelUpMutation();

  /** Validate Card Availability */
  const validateCardAvailability = useCallback(
    (card) =>
      card["level_up_available_date"] === null ||
      isAfter(new Date(), new Date(card["level_up_available_date"] * 1000)),
    []
  );

  /** Validate Card End Time */
  const validateCardEndTime = useCallback(
    (card) =>
      card["end_datetime"] === null ||
      isBefore(new Date(), new Date(card["end_datetime"] * 1000)),
    []
  );

  /** Validate Card Unlock  */
  const validateCardUnlock = useCallback(
    (list, card) =>
      card["unlock_card_id"] === null ||
      card["unlock_card_level"] <=
        (card["unlock_card_id"] === "Friend"
          ? friendCount
          : list.find((item) => item["id"] === card["unlock_card_id"])?.[
              "level"
            ]),
    [friendCount]
  );

  /** All Cards */
  const allCards = useMemo(
    () =>
      authQuery.data["card_info"].reduce(
        (result, category) =>
          result.concat(
            category["card_list"].map((card) => ({
              ...card,
              ["category_id"]: category["category_id"],
              ["category_name"]: category["category_name"],
              ["icon_img_src"]: `https://web.app.ton.tsubasa-rivals.com/img/${(category[
                "category_name"
              ] === "Manage"
                ? "Manager"
                : category["category_name"]
              ).toLowerCase()}/${card["id"]}.webp`,
            }))
          ),
        []
      ),
    [authQuery.data["card_info"]]
  );

  /** Upgradable Cards */
  const availableCards = useMemo(
    () =>
      allCards.filter(
        (card) => card["cost"] <= balance && validateCardEndTime(card)
      ),
    [balance, allCards, validateCardEndTime]
  );

  /** Unlocked Cards */
  const unlockedCards = useMemo(
    () =>
      availableCards.filter(
        (card) => card["unlocked"] || validateCardUnlock(availableCards, card)
      ),
    [availableCards, validateCardUnlock]
  );

  /** Upgradable Cards */
  const upgradableCards = useMemo(
    () => unlockedCards.filter((card) => validateCardAvailability(card)),
    [validateCardAvailability]
  );

  /** Level Zero Cards */
  const levelZeroCards = useMemo(
    () => upgradableCards.filter((item) => item["level"] === 0),
    [upgradableCards]
  );

  /** Required Cards */
  const requiredCards = useMemo(
    () =>
      upgradableCards.filter((item) =>
        availableCards.some(
          (card) =>
            item["id"] === card["unlock_card_id"] &&
            item["level"] < card["unlock_card_level"]
        )
      ),
    [availableCards, upgradableCards]
  );

  /** Log All Cards */
  useEffect(() => {
    logNicely("TSUBASA ALL CARDS", allCards);
    logNicely("TSUBASA AVAILABLE CARDS", availableCards);
    logNicely("TSUBASA UNLOCKED CARDS", unlockedCards);
    logNicely("TSUBASA UPGRADABLE CARDS", upgradableCards);
    logNicely("TSUBASA LEVEL ZERO CARDS", levelZeroCards);
    logNicely("TSUBASA REQUIRED CARDS", requiredCards);
  }, [
    allCards,
    availableCards,
    unlockedCards,
    upgradableCards,
    levelZeroCards,
    requiredCards,
  ]);

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

      /** Pick Random Card */
      const card = collection[Math.floor(Math.random() * collection.length)];

      /** Set Card */
      setCurrentCard(card);

      try {
        /** Level Up */
        const result = await levelUpMutation.mutateAsync({
          cardId: card["id"],
          categoryId: card["category"],
        });

        /** Combo */
        if (result["is_combo"]) {
          toast.success("Tsubasa - Unlocked Combo");
        }
      } catch {}

      /** Delay */
      await delay(2000);

      /** Unlock */
      process.unlock();
    })();
  }, [process, upgradableCards, levelZeroCards, requiredCards]);

  /** Auto-Upgrade */
  useFarmerAutoProcess("cards", true, process);

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 rounded-lg text-white font-bold",
          !process.started ? "bg-indigo-500" : "bg-red-500"
        )}
      >
        {!process.started ? "Start Upgrading" : "Stop Upgrading"}
      </button>

      {process.started && currentCard ? (
        <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-800">
          <>
            <div className="flex gap-2">
              <img
                src={currentCard["icon_img_src"]}
                className="w-10 h-10 rounded-full shrink-0"
              />
              <div className="flex flex-col min-w-0 min-h-0 grow">
                <h2 className="font-bold">{currentCard["name"]}</h2>
                <p className="text-neutral-400">
                  {currentCard["description"] || "(No Description)"}
                </p>
              </div>
            </div>
            <p>
              {levelUpMutation.isPending ? (
                <span className="text-yellow-500">Upgrading Card...</span>
              ) : levelUpMutation.isError ? (
                <span className="text-red-500">Failed to Upgrade Card...</span>
              ) : levelUpMutation.isSuccess ? (
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
}
