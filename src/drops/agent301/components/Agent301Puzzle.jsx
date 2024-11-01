import toast from "react-hot-toast";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import useSocketState from "@/hooks/useSocketState";
import { useCallback } from "react";
import { useMemo } from "react";

import Agent301PuzzleDialog from "./Agent301PuzzleDialog";
import PuzzleIcon from "../assets/images/puzzle.png?format=webp&w=80";
import useAgent301BalanceQuery from "../hooks/useAgent301BalanceQuery";
import useAgent301CardsQuery from "../hooks/useAgent301CardsQuery";
import useAgent301PuzzleMutation from "../hooks/useAgent301PuzzleMutation";

export default function Agent301Puzzle() {
  const cardsQuery = useAgent301CardsQuery();
  const result = cardsQuery.data?.result;
  const attemptsLeft = result?.attemptsLeft || 0;

  const balanceQuery = useAgent301BalanceQuery();
  const claimMutation = useAgent301PuzzleMutation();

  const [showModal, setShowModal, dispatchAndSetShowModal] = useSocketState(
    "agent301.puzzle.modal",
    false
  );

  /** Handle Choice Submit */
  const handleChoiceSubmit = useCallback(
    (choices) => {
      setShowModal(false);

      toast
        .promise(claimMutation.mutateAsync(choices), {
          loading: "Checking...",
          success: "Done...",
          error: "Error!",
        })
        .then(async (data) => {
          const isCorrect = data.result.isCorrect;

          if (isCorrect) {
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

          /** Refetch Cards */
          await cardsQuery.refetch();

          /** Refetch Balance */
          await balanceQuery.refetch();
        });
    },
    [toast, cardsQuery.refetch, balanceQuery.refetch, setShowModal]
  );

  const [handleButtonClick, dispatchAndHandleButtonClick] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(() => {
        if (attemptsLeft >= 1) {
          setShowModal(true);
        }
      }, [attemptsLeft, setShowModal]),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "agent301.puzzle.start",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "agent301.puzzle.start": () => {
          handleButtonClick();
        },
      }),
      [handleButtonClick]
    )
  );

  return (
    <>
      <button
        disabled={attemptsLeft < 1}
        className="flex items-center justify-center w-full gap-2 p-2 disabled:opacity-50"
        onClick={dispatchAndHandleButtonClick}
      >
        <img src={PuzzleIcon} className="w-6 h-6" /> Puzzle
      </button>

      {showModal ? (
        <Agent301PuzzleDialog
          onSubmit={handleChoiceSubmit}
          onOpenChange={(open) => dispatchAndSetShowModal(open)}
        />
      ) : null}
    </>
  );
}
