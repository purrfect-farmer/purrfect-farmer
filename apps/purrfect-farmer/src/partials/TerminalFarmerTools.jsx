import BottomDialog from "@/components/BottomDialog";
import { Dialog } from "radix-ui";
import { cn } from "@/utils";
import useMirroredCallback from "@/hooks/useMirroredCallback";

export const TerminalFarmerTools = ({ context }) => {
  const [executeTool, dispatchAndExecuteTool] = useMirroredCallback(
    `${context.id}-execute-tool`,
    (toolId) => {
      const tool = context.instance.tools.find((t) => t.id === toolId);
      if (tool) {
        tool.action();
      }
    },
    [context.id, context.instance],
  );

  return (
    <BottomDialog
      title={`${context.title} Tools`}
      description={`${context.title} Tools`}
      icon={context.icon}
    >
      <div className="flex flex-col gap-2">
        {context.instance.tools.length > 0 ? (
          context.instance.tools.map((tool) => (
            <Dialog.Close
              onClick={() => {
                tool.dispatch === false
                  ? executeTool(tool.id)
                  : dispatchAndExecuteTool(tool.id);
              }}
              key={tool.id}
              className={cn(
                "bg-neutral-100 dark:bg-neutral-700",
                "flex items-center gap-2 p-2 cursor-pointer rounded-xl",
                "text-left",
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
    </BottomDialog>
  );
};
