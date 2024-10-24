import toast from "react-hot-toast";
import useFarmerApi from "@/hooks/useFarmerApi";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import useSocketState from "@/hooks/useSocketState";
import { useCallback } from "react";
import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import MajorFullscreenSpinner from "./MajorFullscreenSpinner";
import MajorGameButton from "./MajorGameButton";
import MajorPuzzleDialog from "./MajorPuzzleDialog";
import PuzzleDurovIcon from "../assets/images/puzzle-durov.svg";
import useMajorGameErrorHandler from "../hooks/useMajorGameErrorHandler";
import useMajorUserQuery from "../hooks/useMajorUserQuery";

export default function MajorPuzzle() {
  const [showModal, setShowModal, dispatchAndSetShowModal] = useSocketState(
    "major.puzzle.modal",
    false
  );

  const userQuery = useMajorUserQuery();
  const api = useFarmerApi();
  const handleError = useMajorGameErrorHandler();

  const startMutation = useMutation({
    retry(failureCount, e) {
      return !e.response?.data?.detail?.["blocked_until"];
    },
    mutationKey: ["major", "puzzle-durov", "start"],
    mutationFn: () =>
      api.get("https://major.bot/api/durov/").then((res) => res.data),
  });

  const claimMutation = useMutation({
    mutationKey: ["major", "puzzle-durov", "claim"],
    mutationFn: (data) =>
      api.post("https://major.bot/api/durov/", data).then((res) => res.data),
  });

  /** Handle Choice Submit */
  const handleChoiceSubmit = useCallback(
    (data) => {
      setShowModal(false);

      claimMutation.mutateAsync(data).then(({ correct }) => {
        if (correct.length === 4) {
          /** Correct */
          toast.success("Claimed Successfully!", {
            className: "font-bold font-sans",
          });
        } else {
          /** Failed */
          toast.error("Incorrect choices!", {
            className: "font-bold font-sans",
          });
        }

        /** Refetch Balance */
        userQuery.refetch();
      });
    },
    [toast, userQuery, setShowModal]
  );

  const [handleButtonClick, dispatchAndHandleButtonClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        startMutation
          .mutateAsync()
          .then(() => {
            setShowModal(true);
          })
          .catch(handleError);
      }, [setShowModal]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "major.puzzle.start",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "major.puzzle.start": () => {
          handleButtonClick();
        },
      }),
      [handleButtonClick]
    )
  );

  return (
    <>
      <MajorGameButton
        icon={PuzzleDurovIcon}
        title={"Puzzle Durov"}
        reward={5000}
        onClick={dispatchAndHandleButtonClick}
      />

      {startMutation.isPending || claimMutation.isPending ? (
        <MajorFullscreenSpinner />
      ) : null}

      {showModal ? (
        <MajorPuzzleDialog
          onSubmit={handleChoiceSubmit}
          onOpenChange={(open) => dispatchAndSetShowModal(open)}
        />
      ) : null}
    </>
  );
}
