import useFarmerApi from "@/hooks/useFarmerApi";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { useCallback, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import MajorFullscreenSpinner from "./MajorFullscreenSpinner";
import MajorGameButton from "./MajorGameButton";
import RouletteIcon from "../assets/images/roulette.svg";
import useMajorGame from "../hooks/useMajorGame";

export default function MajorRoulette() {
  const game = useMajorGame();
  const api = useFarmerApi();
  const startMutation = useMutation({
    retry(failureCount, e) {
      return !e.response?.data?.detail?.["blocked_until"];
    },
    mutationKey: ["major", "roulette", "start"],
    mutationFn: () =>
      api.get("https://major.bot/api/roulette/").then((res) => res.data),
  });

  const claimMutation = useMutation({
    mutationKey: ["major", "roulette", "claim"],
    mutationFn: () =>
      api.post("https://major.bot/api/roulette/", null).then((res) => res.data),
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
          action: "major.roulette",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "major.roulette": () => {
          handleButtonClick();
        },
      }),
      [handleButtonClick]
    )
  );

  return (
    <>
      <MajorGameButton
        icon={RouletteIcon}
        title={"Roulette"}
        reward={10000}
        onClick={dispatchAndHandleButtonClick}
      />

      {startMutation.isPending || claimMutation.isPending ? (
        <MajorFullscreenSpinner />
      ) : null}
    </>
  );
}
