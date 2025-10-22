import { Dialog } from "radix-ui";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { cn } from "@/lib/utils";

export const TerminalFarmerTools = ({ context }) => {
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
