import { Dialog } from "radix-ui";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import { cn } from "@/lib/utils";
import ButtomDialog from "@/components/ButtomDialog";

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
    <ButtomDialog
      title={`${context.title} Tools`}
      description={`${context.title} Tools`}
      icon={context.icon}
    >
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
    </ButtomDialog>
  );
};
