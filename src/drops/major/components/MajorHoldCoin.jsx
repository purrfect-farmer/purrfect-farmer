import toast from "react-hot-toast";
import useFarmerApi from "@/hooks/useFarmerApi";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { delay } from "@/lib/utils";
import { useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import HoldCoinIcon from "../assets/images/hold-coin.svg";
import MajorFullscreenSpinner from "./MajorFullscreenSpinner";
import MajorGameButton from "./MajorGameButton";
import useMajorGame from "../hooks/useMajorGame";

export default function MajorHoldCoin() {
  const game = useMajorGame();
  const api = useFarmerApi();

  const startMutation = useMutation({
    retry(failureCount, e) {
      return !e.response?.data?.detail?.["blocked_until"];
    },
    mutationKey: ["major", "hold-coin", "start"],
    mutationFn: () =>
      api.get("https://major.bot/api/bonuses/coins/").then((res) => res.data),
  });

  const claimMutation = useMutation({
    mutationKey: ["major", "hold-coin", "claim"],
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
            .post("https://major.bot/api/bonuses/coins/", { coins: 915 })
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
          action: "major.hold-coin",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "major.hold-coin": () => {
          handleButtonClick();
        },
      }),
      [handleButtonClick]
    )
  );

  return (
    <>
      <MajorGameButton
        icon={HoldCoinIcon}
        title={"Hold Coin"}
        reward={915}
        onClick={dispatchAndHandleButtonClick}
      />

      {startMutation.isPending || claimMutation.isPending ? (
        <MajorFullscreenSpinner />
      ) : null}
    </>
  );
}
