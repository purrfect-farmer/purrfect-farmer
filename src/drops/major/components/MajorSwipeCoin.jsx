import toast from "react-hot-toast";
import useFarmerApi from "@/hooks/useFarmerApi";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { delay } from "@/lib/utils";
import { useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import MajorFullscreenSpinner from "./MajorFullscreenSpinner";
import MajorGameButton from "./MajorGameButton";
import SwipeCoinIcon from "../assets/images/swipe-coin.svg";
import useMajorGame from "../hooks/useMajorGame";

export default function MajorSwipeCoin() {
  const game = useMajorGame();
  const api = useFarmerApi();
  const startMutation = useMutation({
    retry(failureCount, e) {
      return !e.response?.data?.detail?.["blocked_until"];
    },
    mutationKey: ["major", "swipe-coin", "start"],
    mutationFn: () =>
      api.get("https://major.bot/api/swipe_coin/").then((res) => res.data),
  });

  const claimMutation = useMutation({
    mutationKey: ["major", "swipe-coin", "claim"],
    mutationFn: () =>
      toast
        .promise(
          delay(60_000),
          {
            loading: "Delaying for 60 secs..",
            success: "Done!",
            error: "Error!",
          },
          {
            className: "font-bold font-sans",
          }
        )
        .then(() =>
          api
            .post("https://major.bot/api/swipe_coin/", {
              coins: 1100 + Math.floor(Math.random() * 20),
            })
            .then((res) => res.data)
        ),
  });

  const [handleButtonClick, dispatchAndHandleButtonClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        game(
          () => startMutation.mutateAsync(),
          () => claimMutation.mutateAsync()
        );
      }, [game]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "major.swipe-coin",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "major.swipe-coin": () => {
          handleButtonClick();
        },
      }),
      [handleButtonClick]
    )
  );

  return (
    <>
      <MajorGameButton
        icon={SwipeCoinIcon}
        title={"Swipe Coin"}
        reward={3000}
        onClick={dispatchAndHandleButtonClick}
      />

      {startMutation.isPending || claimMutation.isPending ? (
        <MajorFullscreenSpinner />
      ) : null}
    </>
  );
}
