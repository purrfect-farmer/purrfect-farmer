import * as Dialog from "@radix-ui/react-dialog";
import toast from "react-hot-toast";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import { cn } from "@/lib/utils";
import { useState } from "react";

import Agent301Icon from "../assets/images/icon.png?format=webp&w=80";

const defaultChoices = () => Array(4).fill("");

export default function Agent301PuzzleDialog({ onSubmit, onOpenChange }) {
  const [choices, setChoices] = useState(defaultChoices);

  const [handleChoiceInput, dispatchAndHandleChoiceInput] =
    useSocketDispatchCallback(
      "agent301.puzzle.input",
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
    );

  const [handleFormSubmit, dispatchAndHandleFormSubmit] =
    useSocketDispatchCallback(
      "agent301.puzzle.submit",
      () => {
        if (choices.some((choice) => !choice)) {
          toast.error("Please enter all choice.", {
            className: "font-bold font-sans",
          });
        } else {
          onSubmit(choices);
        }
      },
      [choices, onSubmit]
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
            <Dialog.Content className="flex flex-col w-full max-w-sm gap-2 p-4 text-white bg-neutral-800 rounded-xl">
              {/* Title */}
              <Dialog.Title
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "text-xl font-bold text-center"
                )}
              >
                <img src={Agent301Icon} className="w-8 h-8 rounded-full" />
                Agent301
              </Dialog.Title>

              {/* Description */}
              <Dialog.Description
                className={cn("inline-flex items-center justify-center gap-2")}
              >
                Puzzle
              </Dialog.Description>

              <form
                onSubmit={(ev) => {
                  ev.preventDefault();
                  dispatchAndHandleFormSubmit();
                }}
                className="flex flex-col gap-2"
              >
                <div className="grid grid-cols-4 gap-2 my-2">
                  {choices.map((choice, index) => (
                    <input
                      key={index}
                      type="number"
                      className={cn(
                        "border-0 rounded-lg bg-black outline-0",
                        "focus:ring focus:ring-blue-500",
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
                    "p-2 text-white bg-blue-500 rounded-xl",
                    "focus:bg-blue-700 hover:bg-blue-700"
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
