import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import useFunaticClaimQuestMutation from "../hooks/useFunaticClaimQuestMutation";
import useFunaticGameQuery from "../hooks/useFunaticGameQuery";
import useFunaticQuestsQuery from "../hooks/useFunaticQuestsQuery";
import useFunaticStartQuestMutation from "../hooks/useFunaticStartQuestMutation";

export default memo(function FunaticQuests() {
  const { joinTelegramLink } = useFarmerContext();

  const gameQuery = useFunaticGameQuery();
  const questsQuery = useFunaticQuestsQuery();

  /** All Quests */
  const allQuests = useMemo(() => questsQuery.data || [], [questsQuery.data]);

  /** Available Quests */
  const availableQuests = useMemo(
    () =>
      allQuests.filter(
        (quest) =>
          quest["is_active"] === true &&
          quest["description"].toUpperCase().includes("WALLET") === false
      ),
    [allQuests]
  );

  /** Pending Quests */
  const pendingQuests = useMemo(
    () => availableQuests.filter((item) => item["status"] === "not_started"),
    [availableQuests]
  );

  /** Unclaimed Quests */
  const unclaimedQuests = useMemo(
    () => availableQuests.filter((item) => item["status"] === "completed"),
    [availableQuests]
  );

  /** Finished Quests */
  const finishedQuests = useMemo(
    () => availableQuests.filter((item) => item["status"] === "claimed"),
    [availableQuests]
  );

  const process = useProcessLock("funatic.quests");

  const [currentQuest, setCurrentQuest] = useState(null);
  const [questOffset, setQuestOffset] = useState(null);
  const [action, setAction] = useState(null);

  const startQuestMutation = useFunaticStartQuestMutation();
  const claimQuestMutation = useFunaticClaimQuestMutation();

  /** Reset Quest */
  const resetQuest = useCallback(() => {
    setCurrentQuest(null);
    setQuestOffset(null);
  }, [setCurrentQuest, setQuestOffset]);

  /** Reset */
  const reset = useCallback(() => {
    resetQuest();
    setAction(null);
  }, [resetQuest, setAction]);

  /** Log All Quests */
  useEffect(() => {
    customLogger("FUNATIC ALL QUESTS", allQuests);
    customLogger("FUNATIC AVAILABLE QUESTS", availableQuests);
    customLogger("FUNATIC PENDING QUESTS", pendingQuests);
    customLogger("FUNATIC UNCLAIMED QUESTS", unclaimedQuests);
    customLogger("FUNATIC FINISHED QUESTS", finishedQuests);
  }, [allQuests, availableQuests, pendingQuests, unclaimedQuests, finishedQuests]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Quests */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    (async function () {
      /** Lock the process */
      process.lock();

      if (!action) {
        setAction("start");
        return process.unlock();
      }
      switch (action) {
        case "start":
          /** Beginning of Start Action */
          setAction("start");
          for (let [index, quest] of Object.entries(pendingQuests)) {
            if (process.controller.signal.aborted) return;

            setQuestOffset(index);
            setCurrentQuest(quest);

            if (quest["action_url"]) {
              if (canJoinTelegramLink(quest["action_url"])) {
                await joinTelegramLink(quest["action_url"]);
              }
            }

            /** Start Quest */
            try {
              await startQuestMutation.mutateAsync(quest["id"]);
            } catch {}

            /** Delay */
            await delay(5_000);
          }

          /** Refetch */
          try {
            await questsQuery.refetch();
          } catch {}

          // Set Next Action
          resetQuest();
          setAction("claim");

          return process.unlock();

        case "claim":
          /** Claim */
          for (let [index, quest] of Object.entries(unclaimedQuests)) {
            if (process.controller.signal.aborted) return;
            setQuestOffset(index);
            setCurrentQuest(quest);
            try {
              await claimQuestMutation.mutateAsync(quest.id);
            } catch {}

            /** Delay */
            await delay(5_000);
          }
          break;
      }

      /** Refetch */
      try {
        await questsQuery.refetch();
        await gameQuery.refetch();
      } catch {}

      resetQuest();
      process.stop();
    })();
  }, [process, action, joinTelegramLink]);

  /** Auto-Complete Quests */
  useFarmerAutoProcess("quests", questsQuery.isLoading === false, process);

  return (
    <>
      <div className="flex flex-col p-4">
        <>
          {/* Quests Info */}
          <h4 className="font-bold">
            Total Quests: {availableQuests.length} / {allQuests.length}
          </h4>
          <h4 className="font-bold text-green-500">
            Finished Quests: {finishedQuests.length}
          </h4>
          <h4 className="font-bold text-yellow-500">
            Pending Quests: {pendingQuests.length}
          </h4>

          <h4 className="font-bold text-purple-500">
            Unclaimed Quests: {unclaimedQuests.length}
          </h4>

          <div className="flex flex-col gap-2 py-2">
            {/* Start Button */}
            <button
              className={cn(
                "px-4 py-2",
                "rounded-lg",
                "disabled:opacity-50",
                process.started
                  ? "bg-red-500 text-white"
                  : "bg-purple-500 text-white"
              )}
              onClick={() => process.dispatchAndToggle(!process.started)}
              disabled={
                pendingQuests.length === 0 && unclaimedQuests.length === 0
              }
            >
              {process.started ? "Stop" : "Start"}
            </button>

            {process.started && currentQuest ? (
              <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
                <h4 className="font-bold">
                  Current Mode:{" "}
                  <span
                    className={
                      action === "start" ? "text-yellow-500" : "text-green-500"
                    }
                  >
                    {action === "start" ? "Starting Quest" : "Claiming Quest"}{" "}
                    {+questOffset + 1}
                  </span>
                </h4>
                <h5 className="font-bold text-purple-500">
                  {currentQuest["description"]}
                </h5>
                <p
                  className={cn(
                    "capitalize",
                    {
                      success: "text-green-500",
                      error: "text-red-500",
                    }[
                      action === "start"
                        ? startQuestMutation.status
                        : claimQuestMutation.status
                    ]
                  )}
                >
                  {action === "start"
                    ? startQuestMutation.status
                    : claimQuestMutation.status}
                </p>
              </div>
            ) : null}
          </div>
        </>
      </div>
    </>
  );
});
