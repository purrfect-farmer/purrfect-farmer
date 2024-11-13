import toast from "react-hot-toast";
import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";
import useFarmerContext from "@/hooks/useFarmerContext";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketState from "@/hooks/useSocketState";
import { logNicely } from "@/lib/utils";
import { useCallback } from "react";

import Agent301PuzzleDialog from "./Agent301PuzzleDialog";
import PuzzleIcon from "../assets/images/puzzle.png?format=webp&w=80";
import useAgent301BalanceQuery from "../hooks/useAgent301BalanceQuery";
import useAgent301CardsQuery from "../hooks/useAgent301CardsQuery";
import useAgent301PuzzleMutation from "../hooks/useAgent301PuzzleMutation";

export default function Agent301Puzzle() {
  const cardsQuery = useAgent301CardsQuery();
  const result = cardsQuery.data?.result;
  const attemptsLeft = result?.attemptsLeft || 0;
  const { dataQuery, processNextTask } = useFarmerContext();

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

      return toast
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
    useSocketDispatchCallback(() => {
      if (attemptsLeft >= 1) {
        setShowModal(true);
      }
    }, [attemptsLeft, setShowModal]);

  /** Complete Puzzle */
  useFarmerAutoTask(
    "wheel.puzzle",
    () => {
      if (cardsQuery.isSuccess) {
        const day = new Date().toISOString().split("T")[0];
        const answer = dataQuery.data?.agent301?.puzzle?.[day];

        /** Log It */
        logNicely("AGENT 301 PUZZLE", day, answer);

        if (attemptsLeft && answer) {
          handleChoiceSubmit(answer).finally(() => {
            processNextTask();
          });
        } else {
          processNextTask();
        }
      }
    },
    [
      attemptsLeft,
      cardsQuery.isSuccess,
      dataQuery.isSuccess,
      handleChoiceSubmit,
      processNextTask,
    ]
  );

  return (
    <>
      <button
        disabled={attemptsLeft < 1}
        className="flex items-center justify-center w-full gap-2 p-2 disabled:opacity-50"
        onClick={() => dispatchAndHandleButtonClick()}
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
