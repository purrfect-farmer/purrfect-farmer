import { HiOutlineStar, HiStar } from "react-icons/hi2";

import BottomDialog from "@/components/BottomDialog";
import { Dialog } from "radix-ui";
import { Fragment } from "react";
import { cn } from "@/utils";
import useMirroredCallback from "@/hooks/useMirroredCallback";

/** Tools header */
function ToolsHeader(props) {
  return (
    <h2
      {...props}
      className={cn("text-neutral-500 dark:text-neutral-400", "font-bold px-4")}
    />
  );
}

/** Tool button */
function ToolButton(props) {
  return (
    <Dialog.Close
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "flex items-center gap-2.5 p-2.5 cursor-pointer rounded-xl",
        "text-left",
      )}
    />
  );
}

/** Tool button title */
function ToolButtonTitle(props) {
  return (
    <h3 {...props} className={cn("min-w-0 truncate w-full", "font-bold")} />
  );
}

export const TerminalFarmerTools = ({ terminalFarmer }) => {
  const { context, isPrimaryFarmerUser, makeAsPrimaryFarmerUser } =
    terminalFarmer;

  /** Execute a tool */
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
        {/* Configurations */}
        <ToolsHeader>Configuration</ToolsHeader>
        <ToolButton onClick={makeAsPrimaryFarmerUser}>
          {isPrimaryFarmerUser ? (
            <HiStar className="shrink-0 text-lime-500" />
          ) : (
            <HiOutlineStar className="shrink-0" />
          )}
          <ToolButtonTitle>Set as primary</ToolButtonTitle>
        </ToolButton>

        {/* Instance Tools */}
        {context.instance.tools.length > 0 ? (
          context.instance.tools.map((group) => (
            <Fragment key={group.name}>
              <ToolsHeader>{group.name}</ToolsHeader>

              {group.list.map((tool) => (
                <ToolButton
                  key={tool.id}
                  onClick={() => {
                    tool.dispatch === false
                      ? executeTool(tool.id)
                      : dispatchAndExecuteTool(tool.id);
                  }}
                >
                  <span className="shrink-0">{tool.emoji}</span>
                  <ToolButtonTitle>{tool.title}</ToolButtonTitle>
                </ToolButton>
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
