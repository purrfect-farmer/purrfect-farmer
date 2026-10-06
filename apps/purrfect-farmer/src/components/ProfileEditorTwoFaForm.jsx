import { Controller, FormProvider, useForm } from "react-hook-form";

import Alert from "./Alert";
import Button from "./Button";
import FieldStateError from "./FieldStateError";
import Input from "./Input";
import Label from "./Label";
import PasswordInput from "./PasswordInput";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useMirroredCallback from "@/hooks/useMirroredCallback";
import useProfileEditorTwoFa from "@/hooks/useProfileEditorTwoFa";
import { useEffect } from "react";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    currentPassword: yup
      .string()
      .when("$hasPassword", {
        is: true,
        then: (schema) => schema.required(),
      })
      .label("Current Password"),
    newPassword: yup.string().required().label("New Password"),
    confirmPassword: yup
      .string()
      .required()
      .oneOf([yup.ref("newPassword")], "Passwords do not match")
      .label("Confirm Password"),
    hint: yup
      .string()
      .optional()
      .test(
        "not-password",
        "Hint must not be the password",
        (value, ctx) => !value || value !== ctx.parent.newPassword,
      )
      .label("Hint"),
  })
  .required();

/** Password Fields */
const PASSWORD_FIELDS = [
  {
    name: "currentPassword",
    label: "Current Password",
    autoComplete: "current-password",
  },
  { name: "newPassword", label: "New Password", autoComplete: "new-password" },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    autoComplete: "new-password",
  },
];

/** Friendly 2FA error */
const getTwoFaError = (err) =>
  err.errorMessage === "PASSWORD_HASH_INVALID"
    ? "Current password is incorrect"
    : err.errorMessage || err.message;

export default function ProfileEditorTwoFaForm() {
  const { state, mutation } = useProfileEditorTwoFa();
  const hasPassword = Boolean(state?.hasPassword);
  const form = useForm({
    resolver: yupResolver(schema),
    context: { hasPassword },
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      hint: "",
    },
  });

  /** Set or change the password, mirrors use the same values */
  const [, dispatchAndUpdateTwoFa] = useMirroredCallback(
    "profile-editor.update-2fa",
    ({ currentPassword, newPassword, hint }) =>
      toast.promise(
        mutation.mutateAsync({
          currentPassword: currentPassword || undefined,
          newPassword,
          hint,
        }),
        {
          loading: "Updating 2FA...",
          success: "2FA password updated!",
          error: (err) => `Error updating 2FA: ${getTwoFaError(err)}`,
        },
      ),
    [mutation.mutateAsync],
  );

  /** Remove the password, mirrors use the same current password */
  const [, dispatchAndRemoveTwoFa] = useMirroredCallback(
    "profile-editor.remove-2fa",
    (currentPassword) =>
      toast.promise(mutation.mutateAsync({ currentPassword }), {
        loading: "Removing 2FA...",
        success: "2FA password removed!",
        error: (err) => `Error removing 2FA: ${getTwoFaError(err)}`,
      }),
    [mutation.mutateAsync],
  );

  /** Validate locally then mirror */
  const handleSubmit = async ({ currentPassword, newPassword, hint }) => {
    await dispatchAndUpdateTwoFa({ currentPassword, newPassword, hint });
  };

  /** Only the current password is needed for removal */
  const handleRemove = async () => {
    const currentPassword = form.getValues("currentPassword");

    if (!currentPassword) {
      form.setError("currentPassword", {
        message: "Current Password is required",
      });
      return;
    }

    await dispatchAndRemoveTwoFa(currentPassword);
  };

  /** Clear the form whenever the state reloads */
  useEffect(() => {
    if (!state) return;

    form.reset({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      hint: state.hint || "",
    });
  }, [state, form.reset]);

  if (!state) {
    return <div className="p-2 text-center">Loading 2FA...</div>;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-2 p-2"
      >
        <Alert variant={hasPassword ? "success" : "warning"}>
          {hasPassword
            ? `2FA is enabled${state.hint ? ` (hint: ${state.hint})` : ""}`
            : "2FA is disabled"}
        </Alert>

        {/* Password Fields (current only when one is set) */}
        {PASSWORD_FIELDS.filter(
          ({ name }) => hasPassword || name !== "currentPassword",
        ).map(({ name, label, autoComplete }) => (
          <Controller
            key={name}
            name={name}
            render={({ field, fieldState }) => (
              <>
                <Label>{label}</Label>
                <PasswordInput
                  {...field}
                  disabled={mutation.isPending}
                  autoComplete={autoComplete}
                  placeholder={label}
                />

                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />
        ))}

        {/* Hint */}
        <Controller
          name="hint"
          render={({ field, fieldState }) => (
            <>
              <Label>Hint</Label>
              <Input
                {...field}
                disabled={mutation.isPending}
                autoComplete="off"
                placeholder="Hint (Optional)"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Set / Change Password Button */}
        <PrimaryButton
          type="submit"
          disabled={mutation.isPending}
          className="mt-4"
        >
          {mutation.isPending
            ? "Updating..."
            : hasPassword
              ? "Change Password"
              : "Set Password"}
        </PrimaryButton>

        {/* Remove Password Button */}
        {hasPassword ? (
          <Button
            type="button"
            variant="danger"
            disabled={mutation.isPending}
            onClick={handleRemove}
          >
            Remove Password
          </Button>
        ) : null}
      </form>
    </FormProvider>
  );
}
