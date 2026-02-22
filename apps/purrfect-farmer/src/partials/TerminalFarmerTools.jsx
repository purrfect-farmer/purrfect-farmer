import BottomDialog from "@/components/BottomDialog";
import { Dialog } from "radix-ui";
import { Fragment } from "react";
import { cn } from "@/utils";
import useMirroredCallback from "@/hooks/useMirroredCallback";

export const TerminalFarmerTools = ({ context }) => {
  const [executeTool, dispatchAndExecuteTool] = useMirroredCallback(
    `${context.id}-execute-tool`,
    (toolId) => {
      const allTools = context.instance.tools.flatMap((group) => group.list);
      const tool = allTools.find((t) => t.id === toolId);
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
          context.instance.tools.map((group) => (
            <Fragment key={group.name}>
              <h2
                className={cn(
                  "text-neutral-500 dark:text-neutral-400",
                  "font-bold px-4",
                )}
              >
                {group.name}
              </h2>

              {group.list.map((tool) => (
                <Dialog.Close
                  key={tool.id}
                  onClick={() => {
                    tool.dispatch === false
                      ? executeTool(tool.id)
                      : dispatchAndExecuteTool(tool.id);
                  }}
                  className={cn(
                    "bg-neutral-100 dark:bg-neutral-700",
                    "flex items-center gap-2.5 p-2.5 cursor-pointer rounded-xl",
                    "text-left",
                  )}
                >
                  <span className="shrink-0">{tool.emoji}</span>
                  <h3 className={cn("min-w-0 truncate w-full", "font-bold")}>
                    {tool.title}
                  </h3>
                </Dialog.Close>
              ))}
            </Fragment>
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
