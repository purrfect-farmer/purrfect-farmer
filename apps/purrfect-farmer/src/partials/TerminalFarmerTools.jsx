import { HiCheckBadge, HiOutlineCheckBadge } from "react-icons/hi2";
import { LuCircleFadingArrowUp, LuDollarSign } from "react-icons/lu";
import {
  MdArrowDownward,
  MdCheck,
  MdOutlineKey,
  MdOutlineWallet,
  MdSearch,
} from "react-icons/md";

import BottomDialog from "@/components/BottomDialog";
import BottomDialogTools from "./BottomDialogTools";
import { Fragment } from "react";
import { TbPlugConnected } from "react-icons/tb";
import useMirroredCallback from "@/hooks/useMirroredCallback";

const TOOLS_ICON = {
  wallet: MdOutlineWallet,
  connect: TbPlugConnected,
  reconnect: LuCircleFadingArrowUp,
  search: MdSearch,
  check: MdCheck,
  import: MdArrowDownward,
  key: MdOutlineKey,
  withdraw: LuDollarSign,
};

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
      title={`${context.title}`}
      description={`Farmer Tools`}
      icon={context.icon}
    >
      <BottomDialogTools.Container>
        {/* Configurations */}
        <BottomDialogTools.Header>Configuration</BottomDialogTools.Header>
        <BottomDialogTools.Button
          onClick={makeAsPrimaryFarmerUser}
          icon={
            isPrimaryFarmerUser ? (
              <HiCheckBadge className="shrink-0 size-5 text-lime-500" />
            ) : (
              <HiOutlineCheckBadge className="shrink-0 size-5" />
            )
          }
        >
          Set as primary
        </BottomDialogTools.Button>

        {/* Instance Tools */}
        {context.instance.tools.length > 0 ? (
          context.instance.tools.map((group) => (
            <Fragment key={group.name}>
              <BottomDialogTools.Header>{group.name}</BottomDialogTools.Header>

              {group.list.map((tool) => (
                <BottomDialogTools.Button
                  key={tool.id}
                  icon={TOOLS_ICON[tool.icon]}
                  onClick={() => {
                    tool.dispatch === false
                      ? executeTool(tool.id)
                      : dispatchAndExecuteTool(tool.id);
                  }}
                >
                  {tool.title}
                </BottomDialogTools.Button>
              ))}
            </Fragment>
          ))
        ) : (
          <div className="text-center text-neutral-500 dark:text-neutral-400">
            No tools available.
          </div>
        )}
      </BottomDialogTools.Container>
    </BottomDialog>
  );
};
