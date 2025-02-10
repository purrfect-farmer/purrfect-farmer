import toast from "react-hot-toast";
import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import { CgSpinner } from "react-icons/cg";
import { canJoinTelegramLink, cn, customLogger, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useState } from "react";

import CoinIcon from "../assets/images/coin.png?format=webp&w=80";
import useYescoinAccountInfoQuery from "../hooks/useYescoinAccountInfoQuery";
import useYescoinCheckQuestMutation from "../hooks/useYescoinCheckQuestMutation";
import useYescoinClaimQuestMutation from "../hooks/useYescoinClaimQuestMutation";
import useYescoinQuestQuery from "../hooks/useYescoinQuestQuery";
import useYescoinReportQuestMutation from "../hooks/useYescoinReportQuestMutation";
import useYescoinStartQuestMutation from "../hooks/useYescoinStartQuestMutation";
import useFarmerContext from "@/hooks/useFarmerContext";

const COMPLETED_USER_STATUS = 8;
const QUEST_CATEGORIES = {
  daily: {
    id: 1,
    key: "Daily",
  },
  achievement: {
    id: 2,
    key: "Achievement",
  },
  partner: {
    id: 3,
    key: "Partner",
  },
};

export default memo(function YescoinQuests({ category }) {
  const { joinTelegramLink } = useFarmerContext();
  const accountInfoQuery = useYescoinAccountInfoQuery();
  const questQuery = useYescoinQuestQuery(QUEST_CATEGORIES[category].id);
  const globalQuests = useMemo(
    () =>
      questQuery.data?.Global?.groups.reduce(
        (result, group) => result.concat(group.items),
        []
      ) || []
  );

  const globalCategoryQuest = globalQuests[0];
  const globalQuestPayload = globalCategoryQuest?.logic.actions[0].payload;
  const globalQuestIsCompleted =
    globalQuestPayload?.condition <= globalQuestPayload?.finished;
  const canClaimGlobalQuest =
    globalQuestIsCompleted &&
    globalCategoryQuest?.ofUserStatus !== COMPLETED_USER_STATUS;

  const quests = useMemo(
    () =>
      questQuery.data?.[QUEST_CATEGORIES[category].key]?.groups
        .reduce((result, group) => result.concat(group.items), [])
        .filter((quest) => quest.description !== "check-in") || [],
    [questQuery.data]
  );

  const uncompletedQuests = useMemo(
    () => quests.filter((item) => item.ofUserStatus !== COMPLETED_USER_STATUS),
    [quests]
  );

  const startQuestMutation = useYescoinStartQuestMutation();
  const checkQuestMutation = useYescoinCheckQuestMutation();
  const claimQuestMutation = useYescoinClaimQuestMutation();
  const reportQuestMutation = useYescoinReportQuestMutation();

  const process = useProcessLock(`yescoin.${category}-quests`);
  const [questOffset, setQuestOffset] = useState(null);
  const [currentQuest, setCurrentQuest] = useState(null);

  const reset = useCallback(() => {
    setQuestOffset(null);
    setCurrentQuest(null);
  }, [setQuestOffset, setCurrentQuest]);

  const runQuest = useCallback(
    async (id) => {
      await toast.promise(
        (async function () {
          /** Quest */
          const quest = quests.find((item) => item.id === id);
          const reportType = quest.logic.actions[0].type;

          /** Start */
          await startQuestMutation.mutateAsync(id);

          /** Report Quest */
          if (reportType) {
            await reportQuestMutation.mutateAsync({
              id,
              type: reportType,
            });

            /** Join Telegram Link */
            if (reportType === "QUEST_OPEN_TG_LINK") {
              const url = quest.logic.actions[0].payload.link;

              if (canJoinTelegramLink(url)) {
                await joinTelegramLink(url);
              }
            }
          }

          /** Delay */
          await delay(5000);

          /** Check */
          const result = await checkQuestMutation.mutateAsync(id);
          await delay(5000);

          if (!result) {
            throw "Not Completed!";
          } else {
            /** Claim */
            await claimQuestMutation.mutateAsync(id);
          }
        })(),
        {
          loading: "Working...",
          error: "Error!",
          success: "Successfully Claimed",
        }
      );
    },
    [quests, joinTelegramLink]
  );

  /** Claim Quest */
  const [claimQuest, dispatchAndClaimQuest] = useSocketDispatchCallback(
    `yescoin.claim-${category}-quest`,
    async (id) => {
      const exists = quests.some(
        (item) => item.id === id && item.ofUserStatus !== COMPLETED_USER_STATUS
      );

      if (!exists) return;

      await runQuest(id);

      await questQuery.refetch();
      await accountInfoQuery.refetch();
    },
    [quests, runQuest]
  );

  /** Log */
  useEffect(() => {
    customLogger(`YESCOIN QUESTS - ${category.toUpperCase()}`, quests);
    customLogger(
      `YESCOIN PENDING QUESTS - ${category.toUpperCase()}`,
      uncompletedQuests
    );
    customLogger(
      `YESCOIN GLOBAL QUEST - ${category.toUpperCase()}`,
      globalCategoryQuest
    );
  }, [
    /** Deps */
    category,
    quests,
    uncompletedQuests,
    globalCategoryQuest,
  ]);

  /** Claim Global Quests */
  useEffect(() => {
    if (canClaimGlobalQuest) {
      toast.promise(claimQuestMutation.mutateAsync(globalCategoryQuest?.id), {
        success: "Successfully Claimed Global Quest",
        loading: "Claiming Global Quest...",
        error: "Error - Global Quest...",
      });
    }
  }, [
    /** Deps */
    canClaimGlobalQuest,
    globalCategoryQuest?.id,
  ]);

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Process */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    /** Execute the process */
    process.execute(async function () {
      for (let [index, quest] of Object.entries(uncompletedQuests)) {
        if (process.controller.signal.aborted) return;
        setQuestOffset(index);
        setCurrentQuest(quest);

        try {
          await runQuest(quest.id);
        } catch {}

        /** Delay */
        await delay(3_000);
      }

      try {
        await questQuery.refetch();
        await accountInfoQuery.refetch();
      } catch {}

      /** Stop */
      return true;
    });
  }, [process]);

  /** Auto-Complete Quests */
  useFarmerAutoProcess(category, questQuery.isLoading === false, process);

  return questQuery.isPending ? (
    <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
  ) : questQuery.isError ? (
    <div className="text-center">Error....</div>
  ) : (
    <div className="flex flex-col gap-2">
      <button
        onClick={() => process.dispatchAndToggle(!process.started)}
        className={cn(
          "px-4 py-2 rounded-lg text-white font-bold disabled:opacity-50",
          !process.started ? "bg-purple-500" : "bg-red-500"
        )}
      >
        {!process.started ? "Auto Claim" : "Stop"}
      </button>

      {process.started && currentQuest ? (
        <div className="flex flex-col gap-2 p-4 rounded-lg bg-neutral-900">
          <h4 className="font-bold">
            <span className="text-yellow-500">
              Running Quest {questOffset !== null ? +questOffset + 1 : null}
            </span>
          </h4>
          <h5 className="font-bold text-purple-500">
            {currentQuest.questName}...
          </h5>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        {quests.map((quest) => (
          <button
            key={quest.id}
            onClick={() => dispatchAndClaimQuest(quest.id)}
            disabled={quest.ofUserStatus === COMPLETED_USER_STATUS}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-700",
              "disabled:opacity-50",
              "text-left"
            )}
          >
            <img src={quest.questIcon} className="w-10 h-10 shrink-0" />
            <div className="flex flex-col min-w-0 min-h-0 grow">
              <h1 className="font-bold">{quest.questName}</h1>
              <p className="text-orange-500">
                +{Intl.NumberFormat().format(quest.logic.rewards[0].value)}{" "}
                <img src={CoinIcon} className="inline h-4" />
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
