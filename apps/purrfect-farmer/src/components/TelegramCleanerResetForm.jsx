import { Controller, FormProvider, useForm } from "react-hook-form";
import { RESET_STEP } from "@purrfect/shared/lib/account/resetTelegramAccount.js";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

import Alert from "./Alert";
import Button from "./Button";
import FieldStateError from "./FieldStateError";
import Label from "./Label";
import LabelToggle from "./LabelToggle";
import PasswordInput from "./PasswordInput";
import { Progress } from "./Progress";

/** The reset form's schema */
const schema = yup
  .object({
    password: yup.string().optional().label("2FA Password"),
    block: yup.boolean(),
    unblockAll: yup.boolean(),
    deleteContacts: yup.boolean(),
    clearSavedMessages: yup.boolean(),
  })
  .required();

/** The reset form's starting values, every option off */
const DEFAULT_VALUES = {
  password: "",
  block: false,
  unblockAll: false,
  deleteContacts: false,
  clearSavedMessages: false,
};

/** The optional steps of a reset */
const OPTIONS = [
  { name: "block", label: "Block removed users and bots" },
  { name: "unblockAll", label: "Unblock everyone" },
  { name: "deleteContacts", label: "Delete contacts" },
  { name: "clearSavedMessages", label: "Clear Saved Messages" },
];

/** The label of each reset step */
const STEP_LABELS = {
  [RESET_STEP.TWO_FA]: "Removing 2FA...",
  [RESET_STEP.UNBLOCK]: "Unblocking everyone...",
  [RESET_STEP.CHATS]: "Removing chats...",
  [RESET_STEP.CONTACTS]: "Deleting contacts...",
  [RESET_STEP.SAVED_MESSAGES]: "Clearing Saved Messages...",
};

/** A form for resetting the account: 2FA removed, then every chat but Telegram and @SpamBot */
export default function TelegramCleanerResetForm({
  isPending,
  progress,
  onReset,
}) {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onReset)}
        className="flex flex-col gap-2 p-2"
      >
        {/* What a reset does */}
        <Alert variant="warning">
          Removes the 2FA, then every chat, bot, group and channel. Only
          Telegram and @SpamBot are kept.
        </Alert>

        {/* 2FA password */}
        <Controller
          name="password"
          render={({ field, fieldState }) => (
            <>
              <Label>2FA Password</Label>
              <PasswordInput
                {...field}
                disabled={isPending}
                autoComplete="current-password"
                placeholder="2FA Password (Optional)"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Options */}
        {OPTIONS.map(({ name, label }) => (
          <Controller
            key={name}
            name={name}
            render={({ field }) => (
              <LabelToggle
                name={field.name}
                checked={field.value}
                disabled={isPending}
                onChange={(ev) => field.onChange(ev.target.checked)}
              >
                {label}
              </LabelToggle>
            )}
          />
        ))}

        {/* Progress */}
        {progress ? (
          <>
            <p className="text-center">{STEP_LABELS[progress.step]}</p>
            {progress.step === RESET_STEP.CHATS && progress.total > 0 ? (
              <Progress current={progress.done} max={progress.total} />
            ) : null}
          </>
        ) : null}

        {/* Reset button */}
        <Button type="submit" variant="danger" disabled={isPending}>
          {isPending ? "Resetting..." : "Reset Account"}
        </Button>
      </form>
    </FormProvider>
  );
}
