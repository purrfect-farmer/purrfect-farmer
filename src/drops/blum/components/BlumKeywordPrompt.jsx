import * as Dialog from "@radix-ui/react-dialog";
import { HiArrowTopRightOnSquare } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { useCallback } from "react";
import { useState } from "react";

import BlumButton from "./BlumButton";
import BlumIcon from "../assets/images/icon.png?format=webp&w=80";
import BlumInput from "./BlumInput";

export default function BlumKeywordPrompt({ task, onSubmit }) {
  const [keyword, setKeyword] = useState("");

  const handleFormSubmit = useCallback(
    (ev) => {
      ev.preventDefault();
      onSubmit(keyword);
    },
    [keyword, onSubmit]
  );

  const handleDialogClose = useCallback(() => {
    onSubmit(null);
  }, [onSubmit]);

  return (
    <Dialog.Root open onOpenChange={handleDialogClose}>
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
              <img src={BlumIcon} className="w-8 h-8 rounded-full" />
              Blum
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className={cn("font-bold text-center")}>
              {task.title}
            </Dialog.Description>

            <form onSubmit={handleFormSubmit} className="flex flex-col gap-2">
              {/* Open Button */}
              <div className="flex justify-center">
                <a
                  href={task?.socialSubscription?.url}
                  target="_blank"
                  className="flex items-center gap-2 p-2 rounded-full bg-neutral-700"
                >
                  <HiArrowTopRightOnSquare /> Open
                </a>
              </div>

              <BlumInput
                value={keyword}
                onChange={(ev) => setKeyword(ev.target.value)}
                placeholder="Keyword"
                className="my-4 bg-black"
              />

              <BlumButton type="submit">Submit</BlumButton>

              <Dialog.Close asChild>
                <BlumButton color="secondary">Cancel</BlumButton>
              </Dialog.Close>
            </form>
          </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
