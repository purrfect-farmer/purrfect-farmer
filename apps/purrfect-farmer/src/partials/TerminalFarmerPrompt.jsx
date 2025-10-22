import { Dialog } from "radix-ui";
import Input from "@/components/Input";
import { cn } from "@/lib/utils";
import { useState } from "react";

export const TerminalFarmerPrompt = ({ context, userInputPrompt }) => {
  const { show, question, answer, cancel } = userInputPrompt;
  const [value, setValue] = useState("");

  if (!show) return null;

  return (
    <Dialog.Root open={true} onOpenChange={() => cancel()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-40",
            "flex items-center justify-center",
            "p-4 overflow-auto bg-black/50"
          )}
        >
          <Dialog.Content className="flex flex-col w-full max-w-sm gap-2 p-4 bg-white dark:bg-neutral-800 rounded-xl">
            {/* Title */}
            <Dialog.Title
              className={cn(
                "inline-flex items-center justify-center gap-2",
                "font-bold text-center"
              )}
            >
              <img src={context.icon} className="w-8 h-8 rounded-full" />
              {context.title}
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="px-2 text-center text-neutral-500 dark:text-neutral-300">
              {question}
            </Dialog.Description>

            {/* User Input */}
            <Input
              type="text"
              onChange={(e) => setValue(e.target.value)}
              value={value}
              className="w-full mb-4"
            />

            <div className="flex justify-end gap-2">
              {/* Cancel Button */}
              <Dialog.Close
                onClick={() => {
                  cancel();
                  setValue("");
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Cancel
              </Dialog.Close>

              {/* Submit Button */}
              <Dialog.Close
                onClick={() => {
                  answer(value);
                  setValue("");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Submit
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
