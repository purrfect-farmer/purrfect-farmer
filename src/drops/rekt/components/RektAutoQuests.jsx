import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useFarmerContext from "@/hooks/useFarmerContext";
import useProcessLock from "@/hooks/useProcessLock";
import { canJoinTelegramLink, cn, delay, logNicely } from "@/lib/utils";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import RektButton from "./RektButton";
import useRektClaimQuestMutation from "../hooks/useRektClaimQuestMutation";
import useRektQuestsQuery from "../hooks/useRektQuestsQuery";
import useRektUserQuery from "../hooks/useRektUserQuery";
import useRektCompleteQuestMutation from "../hooks/useRektCompleteQuestMutation";
import useRektReferredUsersQuery from "../hooks/useRektReferredUsersQuery";

export default function RektAutoQuests() {
  const { joinTelegramLink } = useFarmerContext();
  const client = useQueryClient();
  const questQuery = useRektQuestsQuery();
  const userQuery = useRektUserQuery();
  const referredUsersQuery = useRektReferredUsersQuery();

  const user = userQuery.data;

  const tonWalletAddress = user?.tonWalletAddress;
  const evmWalletAddress = user?.evmWalletAddress;
  const farmedPoints = user?.balance?.farmedPoints || 0;
  const referredUsersCount = referredUsersQuery.data?.referredUsersCount || 0;
  const totalCompleted = questQuery.data?.totalCompleted || 0;

  /** User Quests */
  const userQuests = useMemo(
    () => (questQuery.data ? questQuery.data.userQuests : []),
    [questQuery.data]
  );

  /** Validate Ton Wallet Quest */
  const validateTonWalletQuest = useCallback(
    (item) => item.quest.specificType !== "WALLET_TON" || tonWalletAddress,
    [tonWalletAddress]
  );

  /** Validate Evm Wallet Quest */
  const validateEvmWalletQuest = useCallback(
    (item) => item.quest.specificType !== "WALLET_EVM" || evmWalletAddress,
    [evmWalletAddress]
  );

  /** Validate Progress Quest */
  const validateProgressQuest = useCallback(
    (item) =>
      item.quest.specificType !== "QUESTS" ||
      item.quest.threshold <= totalCompleted,
    [totalCompleted]
  );

  /** Validate Farming Quest */
  const validateFarmingQuest = useCallback(
    (item) =>
      item.quest.specificType !== "FARMING" ||
      item.quest.threshold <= farmedPoints,
    [farmedPoints]
  );

  /** Validate Referrals Quest */
  const validateReferralsQuest = useCallback(
    (item) =>
      item.quest.specificType !== "REFERRALS" ||
      item.quest.threshold <= referredUsersCount,
    [referredUsersCount]
  );

  /** All Quests */
  const quests = useMemo(
    () =>
      userQuests.filter(
        (item) =>
          validateTonWalletQuest(item) &&
          validateEvmWalletQuest(item) &&
          validateProgressQuest(item) &&
          validateFarmingQuest(item) &&
          validateReferralsQuest(item)
      ),
    [
      userQuests,
      validateTonWalletQuest,
      validateEvmWalletQuest,
      validateProgressQuest,
      validateFarmingQuest,
      validateReferralsQuest,
    ]
  );

  /** Pending Quests */
  const pendingQuests = useMemo(
    () => quests.filter((item) => item.questStatus === "NOT_COMPLETED"),
    [quests]
  );

  /** Unclaimed Quests */
  const unclaimedQuests = useMemo(
    () => quests.filter((item) => item.questStatus === "COMPLETED"),
    [quests]
  );

  /** Finished Quests */
  const finishedQuests = useMemo(
    () => quests.filter((item) => item.questStatus === "CLAIMED"),
    [quests]
  );

  const process = useProcessLock("rekt.quests");

  const [currentQuest, setCurrentQuest] = useState(null);
  const [questOffset, setQuestOffset] = useState(null);
  const [action, setAction] = useState(null);

  const startQuestMutation = useRektCompleteQuestMutation();
  const claimQuestMutation = useRektClaimQuestMutation();

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

  /** Refetch Quests */
  const refetchQuests = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["rekt", "quests"],
      }),
    [client]
  );

  /** Refetch Balance */
  const refetchBalance = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["rekt", "user"],
      }),
    [client]
  );

  /** Log It */
  useEffect(() => {
    logNicely("REKT RAW QUESTS", userQuests);
    logNicely("REKT QUESTS", userQuests);
  }, [userQuests, quests]);

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

      const refetch = async () => {
        try {
          await refetchQuests();
          await refetchBalance();
        } catch {}
      };

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

            if (canJoinTelegramLink(quest.quest.link)) {
              await joinTelegramLink(quest.quest.link);
            }

            try {
              await startQuestMutation.mutateAsync(quest.quest.id);
            } catch {}

            /** Delay */
            await delay(5_000);
          }

          // Set Next Action
          try {
            await refetchQuests();
          } catch {}
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
              await claimQuestMutation.mutateAsync(quest.quest.id);
            } catch {}

            /** Delay */
            await delay(5_000);
          }
          break;
      }

      await refetch();
      resetQuest();
      process.stop();
    })();
  }, [process, action, joinTelegramLink]);

  /** Auto-Complete Quests */
  useFarmerAutoProcess(
    "quests",
    [
      userQuery.isLoading,
      referredUsersQuery.isLoading,
      questQuery.isLoading,
    ].every((status) => !status),
    process
  );

  return (
    <>
      <div className="flex flex-col py-2">
        {questQuery.isPending ? (
          <h4 className="font-bold">Fetching quests...</h4>
        ) : questQuery.isError ? (
          <h4 className="font-bold text-red-500">Failed to fetch quests...</h4>
        ) : (
          <>
            {/* Quests Info */}
            <h4 className="font-bold">Total Quests: {userQuests.length}</h4>
            <h4 className="font-bold text-lime-500">
              Finished Quests: {finishedQuests.length}
            </h4>
            <h4 className="font-bold text-yellow-500">
              Pending Quests: {pendingQuests.length}
            </h4>

            <h4 className="font-bold text-sky-200">
              Unclaimed Quests: {unclaimedQuests.length}
            </h4>

            <div className="flex flex-col gap-2 py-2">
              {/* Start Button */}
              <RektButton
                color={process.started ? "danger" : "primary"}
                onClick={() => process.dispatchAndToggle(!process.started)}
                disabled={
                  pendingQuests.length === 0 && unclaimedQuests.length === 0
                }
              >
                {process.started ? "Stop" : "Start"}
              </RektButton>

              {process.started && currentQuest ? (
                <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-800">
                  <h4 className="font-bold">
                    Current Mode:{" "}
                    <span
                      className={
                        action === "start"
                          ? "text-yellow-500"
                          : "text-green-500"
                      }
                    >
                      {action === "start" ? "Starting Quest" : "Claiming Quest"}{" "}
                      {+questOffset + 1}
                    </span>
                  </h4>
                  <h5 className="font-bold">{currentQuest.quest.name}</h5>
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
        )}
      </div>
    </>
  );
}
