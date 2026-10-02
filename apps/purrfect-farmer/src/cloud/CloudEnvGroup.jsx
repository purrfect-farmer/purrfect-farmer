import { useEffect, useState } from "react";

import CloudEnvField from "./CloudEnvField";
import CloudEnvGroupIcon from "./CloudEnvGroupIcon";
import CloudEnvTest from "./CloudEnvTest";
import { Collapsible } from "radix-ui";
import { HiChevronDown } from "react-icons/hi2";
import { cn } from "@/utils";
import { farmersMap } from "@/core/farmers";
import { useFormState } from "react-hook-form";

export default function CloudEnvGroup({
  group,
  fields,
  data,
  resets,
  toggleReset,
  getTestValues,
  disabled,
  open,
}) {
  const { dirtyFields } = useFormState();
  const changed = fields.filter(
    (field) => dirtyFields[field.key] || resets.has(field.key),
  ).length;
  const farmer = group.farmer ? farmersMap?.get(group.farmer) : null;
  const [isOpen, setIsOpen] = useState(open);

  /** Follow the parent when searching opens or closes groups */
  useEffect(() => setIsOpen(open), [open]);

  return (
    <Collapsible.Root
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-xl bg-neutral-50 dark:bg-neutral-700/40"
    >
      <Collapsible.Trigger className="flex items-center w-full gap-2 p-3 font-bold text-left cursor-pointer">
        <CloudEnvGroupIcon group={group} />
        <span className="grow min-w-0 truncate">
          {farmer?.title || group.title}
        </span>
        {changed ? (
          <span className="px-2 text-xs text-white bg-blue-500 rounded-full">
            {changed} changed
          </span>
        ) : null}
        <HiChevronDown
          className={cn(
            "size-4 shrink-0 text-neutral-500 transition-transform",
            isOpen && "rotate-180",
          )}
        />
      </Collapsible.Trigger>

      {/* Kept mounted so fields keep their state while closed */}
      <Collapsible.Content
        forceMount
        className="flex flex-col gap-4 px-3 pb-3 data-[state=closed]:hidden"
      >
        {group.description ? (
          <p className="text-neutral-500 dark:text-neutral-400">
            {group.description}
          </p>
        ) : null}

        {fields.map((field) => (
          <CloudEnvField
            key={field.key}
            field={field}
            secret={data.secrets[field.key]}
            issue={data.issues[field.key]}
            isSet={
              field.key in data.values || Boolean(data.secrets[field.key]?.isSet)
            }
            resetting={resets.has(field.key)}
            onReset={() => toggleReset(field.key)}
            disabled={disabled}
          />
        ))}

        {group.test ? (
          <CloudEnvTest
            service={group.test}
            getValues={getTestValues}
            disabled={disabled}
          />
        ) : null}
      </Collapsible.Content>
    </Collapsible.Root>
  );
}
