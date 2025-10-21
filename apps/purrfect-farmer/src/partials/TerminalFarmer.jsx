import Farmer from "@/components/Farmer";
import FarmerHeader from "@/components/FarmerHeader";
import useDropFarmer from "@/hooks/useDropFarmer";
import useTerminalFarmer from "@/hooks/useTerminalFarmer";
import { HiOutlineWrenchScrewdriver, HiPlay, HiStop } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { memo } from "react";
import { Dialog } from "radix-ui";
import Input from "@/components/Input";
import { useState } from "react";
import useMirroredState from "@/hooks/useMirroredState";
import useMirroredCallback from "@/hooks/useMirroredCallback";

const TerminalFarmerTools = ({ context }) => {
  const [, dispatchAndExecuteTool] = useMirroredCallback(
    `${context.id}-execute-tool`,
    (toolId) => {
      const tool = context.instance.tools.find((t) => t.id === toolId);
      if (tool) {
        tool.action();
      }
    },
    [context.id, context.instance]
  );

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
      <Dialog.Content
        className={cn(
          "bg-white dark:bg-neutral-800",
          "fixed z-50 inset-x-0 bottom-0 flex flex-col h-3/4 rounded-t-xl",
          "flex flex-col"
        )}
        onOpenAutoFocus={(ev) => ev.preventDefault()}
      >
        <>
          <div className="flex flex-col min-w-0 min-h-0 gap-2 p-4 overflow-auto grow">
            <div className="flex relative">
              {/* Icon */}
              <img src={context.icon} className="w-12 mx-auto rounded-full" />
            </div>

            {/* Title */}
            <Dialog.Title className="text-xl text-center">
              <span
                className={cn(
                  "text-transparent font-turret-road font-bold",
                  "bg-clip-text",
                  "bg-linear-to-r from-green-500 to-blue-400"
                )}
              >
                {context.title} Tools
              </span>
            </Dialog.Title>

            {/* Description */}
            <Dialog.Description className="sr-only">
              {context.title} Tools
            </Dialog.Description>

            <div className="flex flex-col gap-2">
              {context.instance.tools.length > 0 ? (
                context.instance.tools.map((tool) => (
                  <Dialog.Close
                    onClick={() => dispatchAndExecuteTool(tool.id)}
                    key={tool.id}
                    className={cn(
                      "bg-neutral-100 dark:bg-neutral-700",
                      "flex items-center gap-2 p-2 cursor-pointer rounded-xl",
                      "text-left"
                    )}
                  >
                    <h3 className={cn("min-w-0 truncate w-full", "font-bold")}>
                      {tool.title}
                    </h3>
                  </Dialog.Close>
                ))
              ) : (
                <div className="text-center text-neutral-500 dark:text-neutral-400">
                  No tools available.
                </div>
              )}
            </div>
          </div>
        </>
      </Dialog.Content>
    </Dialog.Portal>
  );
};

const TerminalFarmerPrompt = ({ context, userInputPrompt }) => {
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

const TerminalFarmerContent = () => {
  const {
    context,
    userInputPrompt,
    referralLink,
    terminalRef,
    started,
    toggle,
  } = useTerminalFarmer();

  /** Tools Panel State */
  const [showToolsPanel, setShowToolsPanel, dispatchAndSetShowToolsPanel] =
    useMirroredState(`${context.id}.toggle-tools-panel`, false);

  return (
    <>
      {/* User Input Prompt */}
      <TerminalFarmerPrompt
        context={context}
        userInputPrompt={userInputPrompt}
      />

      {/* Terminal Farmer Header */}
      <div className="p-2 border-b dark:border-neutral-700">
        <FarmerHeader referralLink={referralLink} />
      </div>

      <div className="flex gap-2 items-center pr-11">
        {/* Tools Dialog */}
        <Dialog.Root
          open={showToolsPanel}
          onOpenChange={dispatchAndSetShowToolsPanel}
        >
          <Dialog.Trigger
            className={cn(
              "flex items-center justify-center gap-2 p-2",
              "hover:bg-neutral-100 dark:hover:bg-neutral-700",
              "text-blue-500"
            )}
          >
            <HiOutlineWrenchScrewdriver className="size-5" />
          </Dialog.Trigger>
          <TerminalFarmerTools context={context} />
        </Dialog.Root>

        {/* Start/Stop Button */}
        <button
          onClick={() => toggle(!started)}
          className={cn(
            "flex grow min-w-0 items-center justify-center gap-2 p-2",
            started ? "text-red-500" : "text-green-500"
          )}
        >
          {started ? (
            <HiStop className="size-5" />
          ) : (
            <HiPlay className="size-5" />
          )}
          {started ? "Stop" : "Start"}
        </button>
      </div>
      <div
        ref={terminalRef}
        className="grow overflow-auto bg-black text-white p-2 font-mono whitespace-pre-wrap"
      />
    </>
  );
};

function TerminalFarmer() {
  const farmer = useDropFarmer();
  return (
    <Farmer farmer={farmer}>
      <TerminalFarmerContent />
    </Farmer>
  );
}

export default memo(TerminalFarmer);
