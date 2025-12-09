import { cn } from "@/lib/utils";
import { Accordion } from "radix-ui";
import { HiChevronRight, HiOutlineSquares2X2 } from "react-icons/hi2";
import { Reorder, useDragControls } from "motion/react";
import { memo } from "react";
import ResetButton from "@/components/ResetButton";
import ConfirmButton from "@/components/ConfirmButton";
import Input from "@/components/Input";
import { useState } from "react";

export const SettingsLabel = ({ children }) => (
  <label className="px-1 text-neutral-500 dark:text-neutral-400">
    {children}
  </label>
);

export const SettingsInput = ({
  defaultValue = "",
  initialValue = "",
  onConfirm,
  ...props
}) => {
  const [value, setValue] = useState(initialValue || defaultValue || "");

  return (
    <div className="flex gap-2">
      {/* Input */}
      <Input
        {...props}
        value={value}
        onChange={(ev) => setValue(ev.target.value)}
      />

      {/* Reset Button */}
      {defaultValue !== "" ? (
        <ResetButton
          disabled={props.disabled}
          onClick={() => setValue(defaultValue || "")}
        />
      ) : null}

      {/* Set Button */}
      <ConfirmButton
        disabled={props.disabled}
        onClick={() => onConfirm(value)}
      />
    </div>
  );
};

export const SettingsContainer = memo(({ children, value, onValueChange }) => {
  return (
    <Accordion.Root
      className="flex flex-col gap-2"
      value={value}
      onValueChange={onValueChange}
      collapsible
    >
      {children}
    </Accordion.Root>
  );
});

export const SettingsGroup = memo(({ id, title, children }) => {
  return (
    <Accordion.Item value={id} className={cn("flex flex-col gap-2")}>
      <Accordion.Trigger
        className={cn(
          "bg-neutral-100 dark:bg-neutral-700",
          "data-[state=open]:bg-blue-500",
          "data-[state=open]:text-white",
          "flex items-center gap-4 p-2 cursor-pointer rounded-xl",
          "group"
        )}
      >
        <h4 className="min-w-0 min-h-0 grow font-bold ml-9">{title}</h4>

        <HiChevronRight
          className={cn("size-5", "group-data-[state=open]:-rotate-90")}
        />
      </Accordion.Trigger>
      <Accordion.Content
        className={cn(
          "flex flex-col gap-2",
          "after:w-2/4 after:h-2",
          "after:rounded-full",
          "after:bg-blue-400",
          "after:mx-auto",
          "after:my-1"
        )}
      >
        {children}
      </Accordion.Content>
    </Accordion.Item>
  );
});

export const DropReorderItem = memo(({ children, ...props }) => {
  const dragControls = useDragControls();
  return (
    <Reorder.Item {...props} dragListener={false} dragControls={dragControls}>
      <div className="flex gap-2">
        <div className="min-w-0 min-h-0 grow">{children}</div>
        <button
          className={cn(
            "bg-neutral-100 dark:bg-neutral-700",
            "flex items-center justify-center",
            "px-3 rounded-lg shrink-0",
            "touch-none"
          )}
          onPointerDown={(event) => dragControls.start(event)}
        >
          <HiOutlineSquares2X2 className="w-4 h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
});
