import { HiOutlineArrowPath, HiOutlineSparkles } from "react-icons/hi2";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { useController, useFormContext } from "react-hook-form";

import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import Label from "@/components/Label";
import LabelToggle from "@/components/LabelToggle";
import Select from "@/components/Select";
import { cn } from "@/utils";
import toast from "react-hot-toast";
import useCloudManagerEnvRevealMutation from "@/hooks/useCloudManagerEnvRevealMutation";
import { useState } from "react";

/** Random hex for login secrets */
const generateSecret = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

/** Placeholder hinting the value used when the field is empty */
const getPlaceholder = (field, secret) => {
  if (field.type === "secret") {
    return secret?.isSet ? `Saved (${secret.preview})` : "Not set";
  }

  return field.default !== undefined && field.default !== ""
    ? `Default: ${field.default}`
    : "Not set";
};

const SecretInput = ({ field, secret, controller, disabled }) => {
  const { resetField, setValue } = useFormContext();
  const revealMutation = useCloudManagerEnvRevealMutation();
  const [shown, setShown] = useState(false);

  /** Load the saved value the first time it is revealed */
  const toggle = async () => {
    if (!shown && secret?.isSet && !controller.fieldState.isDirty) {
      try {
        const value = await revealMutation.mutateAsync(field.key);
        resetField(field.key, { defaultValue: value });
      } catch {
        toast.error("Failed to reveal value");
        return;
      }
    }

    setShown((value) => !value);
  };

  /** Fill a fresh random secret */
  const generate = () => {
    setValue(field.key, generateSecret(), { shouldDirty: true });
    setShown(true);
  };

  return (
    <div className="flex gap-2">
      <div className="relative grow min-w-0">
        <Input
          {...controller.field}
          disabled={disabled}
          type={shown ? "text" : "password"}
          autoComplete="off"
          placeholder={getPlaceholder(field, secret)}
          className="pr-9 font-mono"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={toggle}
          disabled={disabled || revealMutation.isPending}
          className="absolute inset-y-0 right-0 px-2.5 disabled:opacity-50"
          title={shown ? "Hide" : "Reveal"}
        >
          {shown ? (
            <MdVisibility className="size-4" />
          ) : (
            <MdVisibilityOff className="size-4" />
          )}
        </button>
      </div>

      {field.generate ? (
        <button
          type="button"
          onClick={generate}
          disabled={disabled}
          className={cn(
            "px-3 rounded-lg shrink-0 inline-flex items-center gap-1",
            "bg-neutral-200 dark:bg-neutral-900 disabled:opacity-50",
          )}
        >
          <HiOutlineSparkles className="size-4" /> Generate
        </button>
      ) : null}
    </div>
  );
};

export default function CloudEnvField({
  field,
  secret,
  issue,
  isSet,
  resetting,
  onReset,
  disabled,
}) {
  const controller = useController({ name: field.key });
  const { fieldState } = controller;
  const isDisabled = disabled || resetting;

  /** Input for the field type */
  const renderInput = () => {
    switch (field.type) {
      case "boolean":
        return (
          <LabelToggle
            name={controller.field.name}
            onBlur={controller.field.onBlur}
            checked={Boolean(controller.field.value)}
            onChange={(ev) => controller.field.onChange(ev.target.checked)}
            disabled={isDisabled}
          >
            {field.label}
          </LabelToggle>
        );

      case "enum":
        return (
          <Select {...controller.field} disabled={isDisabled}>
            {!field.required ? (
              <Select.Item value="">
                {field.default ? `Default (${field.default})` : "Default"}
              </Select.Item>
            ) : null}
            {field.options.map((option) => (
              <Select.Item key={option} value={option}>
                {option}
              </Select.Item>
            ))}
          </Select>
        );

      case "secret":
        return (
          <SecretInput
            field={field}
            secret={secret}
            controller={controller}
            disabled={isDisabled}
          />
        );

      default:
        return (
          <Input
            {...controller.field}
            disabled={isDisabled}
            autoComplete="off"
            inputMode={
              ["number", "telegramId", "threadId"].includes(field.type)
                ? "numeric"
                : field.type === "url"
                  ? "url"
                  : undefined
            }
            placeholder={getPlaceholder(field, secret)}
            className={cn(field.type === "cron" && "font-mono")}
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Label */}
      {field.type !== "boolean" ? (
        <Label>
          <span className="grow">
            {field.label}
            {field.required ? <span className="text-red-500"> *</span> : null}
          </span>
        </Label>
      ) : null}

      {renderInput()}

      {/* Help */}
      {field.help ? (
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {field.help}
        </p>
      ) : null}

      {/* Change warning */}
      {field.warning && fieldState.isDirty ? (
        <p className="text-xs text-orange-500">{field.warning}</p>
      ) : null}

      {/* Problem with the saved value */}
      {issue && !fieldState.isDirty && !resetting ? (
        <p className="text-xs text-orange-500">Saved value: {issue}</p>
      ) : null}

      <FieldStateError fieldState={fieldState} className="text-xs" />

      {/* Reset to default */}
      {isSet && !field.required ? (
        <button
          type="button"
          onClick={onReset}
          disabled={disabled}
          className={cn(
            "self-start text-xs inline-flex items-center gap-1",
            resetting ? "text-orange-500" : "text-blue-500",
          )}
        >
          <HiOutlineArrowPath className="size-3" />
          {resetting ? "Will reset to default (undo)" : "Reset to default"}
        </button>
      ) : null}
    </div>
  );
}
