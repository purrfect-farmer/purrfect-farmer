import { Dialog } from "radix-ui";
import FarmerHeader from "@/components/FarmerHeader";
import useTerminalFarmer from "@/hooks/useTerminalFarmer";
import { cn } from "@/lib/utils";
import { HiOutlineWrenchScrewdriver, HiStop, HiPlay } from "react-icons/hi2";
import { TerminalFarmerPrompt } from "./TerminalFarmerPrompt";
import { TerminalFarmerTools } from "./TerminalFarmerTools";
import useMirroredLocationToggle from "@/hooks/useMirroredLocationToggle";
import Container from "@/components/Container";

export const TerminalFarmerContent = () => {
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
    useMirroredLocationToggle(`${context.id}.toggle-tools-panel`, false);

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

      <Container className="flex gap-2 items-center p-0">
        {/* Tools Dialog */}
        <Dialog.Root
          open={showToolsPanel}
          onOpenChange={dispatchAndSetShowToolsPanel}
        >
          <Dialog.Trigger
            className={cn(
              "flex items-center justify-center gap-2 p-2 w-10 shrink-0",
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

        <span className="w-10" />
      </Container>

      <div className={cn("grow overflow-auto bg-black text-white")}>
        <Container
          ref={terminalRef}
          className={cn("font-mono whitespace-pre-wrap wrap-break-word p-2")}
        />
      </div>
    </>
  );
};
