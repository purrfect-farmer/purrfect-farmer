import useFarmerAutoProcess from "@/hooks/useFarmerAutoProcess";
import useProcessLock from "@/hooks/useProcessLock";
import { cn, delay } from "@/lib/utils";
import { memo } from "react";
import { useCallback } from "react";
import { useEffect } from "react";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import WontonButton from "./WontonButton";
import useWontonBadgesQuery from "../hooks/useWontonBadgesQuery";
import useWontonClaimBadgeMutation from "../hooks/useWontonClaimBadgeMutation";
import useWontonUserQuery from "../hooks/useWontonUserQuery";

export default memo(function WontonAutoBadges() {
  const client = useQueryClient();
  const badgesQuery = useWontonBadgesQuery();
  const userQuery = useWontonUserQuery();

  /** All Badges */
  const badges = useMemo(
    () => (badgesQuery.data ? Object.values(badgesQuery.data.badges) : []),
    [badgesQuery.data]
  );

  /** Unclaimed Badges */
  const unclaimedBadges = useMemo(
    () => badges.filter((item) => Number(item.progress) >= Number(item.target)),
    [badges]
  );

  /** Process */
  const process = useProcessLock("wonton.badges");

  /** Current Badge */
  const [currentBadge, setCurrentBadge] = useState(null);

  /** Claim Badge Mutation */
  const claimBadgeMutation = useWontonClaimBadgeMutation();

  /** Reset Badge */
  const resetBadge = useCallback(() => {
    setCurrentBadge(null);
  }, [setCurrentBadge]);

  /** Reset */
  const reset = useCallback(() => {
    resetBadge();
  }, [resetBadge]);

  /** Refetch Badges */
  const refetchBadges = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["wonton", "badges"],
      }),
    [client]
  );

  /** Refetch Balance */
  const refetchBalance = useCallback(
    () =>
      client.refetchQueries({
        queryKey: ["wonton", "user"],
      }),
    [client]
  );

  /** Reset */
  useEffect(reset, [process.started, reset]);

  /** Run Badges */
  useEffect(() => {
    if (!process.canExecute) {
      return;
    }

    if (!unclaimedBadges.length) {
      process.stop();
      return;
    }

    /** Execute the process */
    process.execute(async function () {
      /** Refetch Callback */
      const refetch = async () => {
        try {
          await refetchBadges();
          await refetchBalance();
        } catch {}
      };

      /** Set Badge */
      setCurrentBadge(unclaimedBadges[0]);

      /** Claim Badge */
      await claimBadgeMutation.mutateAsync(unclaimedBadges[0].type);

      /** Refetch */
      await refetch();

      /** Delay */
      await delay(1000);
    });
  }, [process, unclaimedBadges]);

  /** Auto-Complete Badges */
  useFarmerAutoProcess("badges", process, [badgesQuery.isLoading === false]);

  return (
    <>
      <div className="flex flex-col py-2">
        {badgesQuery.isPending ? (
          <h4 className="font-bold">Fetching badges...</h4>
        ) : badgesQuery.isError ? (
          <h4 className="font-bold text-red-500">Failed to fetch badges...</h4>
        ) : (
          <>
            {/* Badges Info */}
            <h4 className="font-bold">Total Badges: {badges.length}</h4>

            <h4 className="font-bold text-purple-500">
              Unclaimed Badges: {unclaimedBadges.length}
            </h4>

            <div className="flex flex-col gap-2 py-2">
              {/* Start Button */}
              <WontonButton
                color={process.started ? "danger" : "primary"}
                onClick={() => process.dispatchAndToggle(!process.started)}
                disabled={unclaimedBadges.length === 0}
              >
                {process.started ? "Stop" : "Start"}
              </WontonButton>

              {process.started && currentBadge ? (
                <div className="flex flex-col gap-2 p-4 text-white rounded-lg bg-neutral-900">
                  <div className="flex gap-2">
                    <img
                      src={currentBadge.badgeImageUrl}
                      className="w-10 h-10 shrink-0"
                    />
                    <div className="flex flex-col min-w-0 min-h-0 gap-2 truncate grow">
                      <h5 className="font-bold">{currentBadge.name}</h5>
                      <p className="text-lime-500">
                        {currentBadge.progress}/{currentBadge.target}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "capitalize",
                      {
                        success: "text-green-500",
                        error: "text-red-500",
                      }[claimBadgeMutation.status]
                    )}
                  >
                    {claimBadgeMutation.status}
                  </p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
});
