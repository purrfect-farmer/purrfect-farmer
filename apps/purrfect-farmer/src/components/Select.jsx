import { cn } from "@/utils";
import { memo } from "react";

const Select = memo(function Select(props) {
  return (
    <select
      {...props}
      className={cn(
        "bg-neutral-100 dark:bg-neutral-700",
        "p-2.5 rounded-lg font-bold w-full min-w-0",
        "focus:outline-hidden focus:ring-3 focus:ring-blue-300",
        "disabled:opacity-50",
        props.className
      )}
    />
  );
});

const SelectItem = memo(function SelectItem(props) {
  return <option {...props} className="bg-white dark:bg-neutral-800" />;
});

Select.Item = SelectItem;

export default Select;
