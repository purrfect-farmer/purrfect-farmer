import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";

import MajorIcon from "../assets/images/icon.png?format=webp&w=80";
import PuzzleDurovIcon from "../assets/images/puzzle-durov.svg";
import StarIcon from "../assets/images/star-amount.svg";

const defaultChoices = () => Array(4).fill("");

export default function MajorPuzzleDialog({ onSubmit, onOpenChange }) {
  const [choices, setChoices] = useState(defaultChoices);

  const [handleChoiceInput, dispatchAndHandleChoiceInput] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(
        (index, value) => {
          if (value && (value < 1 || value > 16)) {
            return;
          }
          setChoices((previous) =>
            previous.map((choice, choiceIndex) =>
              index === choiceIndex ? value && parseInt(value) : choice
            )
          );
        },
        [setChoices]
      ),

      /** Dispatch */
      useCallback((socket, index, value) => {
        socket.dispatch({
          action: "major.puzzle.input",
          data: {
            index,
            value,
          },
        });
      }, [])
    );

  const [handleFormSubmit, dispatchAndHandleFormSubmit] =
    useSocketDispatchCallback(
      /** Main */
      useCallback(
        (ev) => {
          ev?.preventDefault();

          if (choices.some((choice) => !choice)) {
            toast.error("Please enter all choice.", {
              className: "font-bold font-sans",
            });
          } else {
            onSubmit(
              Object.fromEntries(
                Object.entries(choices).map(([k, v]) => [
                  "choice_" + (+k + 1),
                  v,
                ])
              )
            );
          }
        },
        [choices, onSubmit]
      ),

      /** Dispatch */
      useCallback((socket) => {
        socket.dispatch({
          action: "major.puzzle.submit",
        });
      }, [])
    );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "major.puzzle.input": (command) => {
          handleChoiceInput(command.data.index, command.data.value);
        },
        "major.puzzle.submit": () => {
          handleFormSubmit();
        },
      }),
      [handleChoiceInput, handleFormSubmit]
    )
  );

  return (
    <>
      <Dialog.Root defaultOpen onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(
              "fixed inset-0 z-40",
              "flex items-center justify-center",
              "p-4 overflow-auto bg-black/50"
            )}
          >
            <Dialog.Content className="flex flex-col w-full max-w-sm gap-2 p-4 bg-white rounded-xl">
              {/* Title */}
              <Dialog.Title
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "text-xl font-bold text-center"
                )}
              >
                <img src={MajorIcon} className="w-8 h-8 rounded-full" />
                Major
              </Dialog.Title>

              {/* Description */}
              <Dialog.Description
                className={cn("inline-flex items-center justify-center gap-2")}
              >
                <img src={PuzzleDurovIcon} className="w-8 h-8 shrink-0" />

                <span className="inline-flex flex-col">
                  <span className="font-bold">Puzzle Durov</span>
                  <span className="text-orange-500">
                    +5000 <img src={StarIcon} className="inline h-4" />
                  </span>
                </span>
              </Dialog.Description>

              <form
                onSubmit={dispatchAndHandleFormSubmit}
                className="flex flex-col gap-2"
              >
                <div className="grid grid-cols-4 gap-2 my-2">
                  {choices.map((choice, index) => (
                    <input
                      key={index}
                      type="number"
                      className={cn(
                        "border-0 rounded-lg bg-neutral-100 outline-0",
                        "focus:ring focus:ring-orange-500",
                        "text-center font-bold text-xl",
                        "py-2"
                      )}
                      value={choice}
                      onChange={(ev) =>
                        dispatchAndHandleChoiceInput(index, ev.target.value)
                      }
                      max={16}
                      min={1}
                      style={{
                        "-webkit-appearance": "none",
                        "-moz-appearance": "textfield",
                      }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  className={cn(
                    "p-2 text-white bg-purple-500 rounded-xl",
                    "focus:bg-purple-700 hover:bg-purple-700"
                  )}
                >
                  Check
                </button>

                <Dialog.Close className="p-2 text-white bg-red-500 rounded-xl">
                  Cancel
                </Dialog.Close>
              </form>
            </Dialog.Content>
          </Dialog.Overlay>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
