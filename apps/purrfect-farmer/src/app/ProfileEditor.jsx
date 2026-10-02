import * as yup from "yup";

import { Controller, FormProvider, useForm } from "react-hook-form";
import { useCallback, useEffect, useState } from "react";

import Button from "@/components/Button";
import FieldStateError from "@/components/FieldStateError";
import Input from "@/components/Input";
import Label from "@/components/Label";
import PasswordInput from "@/components/PasswordInput";
import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";
import useAppContext from "@/hooks/useAppContext";
import { useMutation } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";

/** Schema */
const schema = yup
  .object({
    firstName: yup.string().optional().label("First Name"),
    lastName: yup.string().optional().label("Last Name"),
    username: yup.string().optional().label("Username"),
  })
  .required();

/** 2FA Schema */
const twoFaSchema = yup
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

/** Friendly 2FA error */
const getTwoFaError = (err) =>
  err.errorMessage === "PASSWORD_HASH_INVALID"
    ? "Current password is incorrect"
    : err.errorMessage || err.message;

/** 2FA Editor */
function TwoFaEditor({ client }) {
  const [state, setState] = useState(null);
  const hasPassword = Boolean(state?.hasPassword);
  const form = useForm({
    resolver: yupResolver(twoFaSchema),
    context: { hasPassword },
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      hint: "",
    },
  });

  /** Load 2FA State */
  const loadState = useCallback(
    () =>
      client.getPasswordState().then((result) => {
        setState(result);
        form.reset({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
          hint: result.hint || "",
        });
      }),
    [client, setState],
  );

  const mutation = useMutation({
    mutationKey: ["profile-editor", "update-2fa"],
    mutationFn: (data) => client.updateTwoFa(data),
    onSuccess: () => loadState(),
  });

  /** Set or change the password */
  const handleSubmit = async ({ currentPassword, newPassword, hint }) => {
    await toast.promise(
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
    );
  };

  /** Remove the password, only the current one is needed */
  const handleRemove = async () => {
    const currentPassword = form.getValues("currentPassword");

    if (!currentPassword) {
      form.setError("currentPassword", {
        message: "Current Password is required",
      });
      return;
    }

    await toast.promise(mutation.mutateAsync({ currentPassword }), {
      loading: "Removing 2FA...",
      success: "2FA password removed!",
      error: (err) => `Error removing 2FA: ${getTwoFaError(err)}`,
    });
  };

  useEffect(() => {
    loadState().catch((err) =>
      toast.error(`Error loading 2FA: ${err.message}`),
    );
  }, [loadState]);

  if (!state) {
    return <div className="p-2 text-center">Loading 2FA...</div>;
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex flex-col gap-2 p-2"
      >
        <h3 className="font-bold">Two-Step Verification</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          {hasPassword
            ? `2FA is enabled${state.hint ? ` (hint: ${state.hint})` : ""}`
            : "2FA is disabled"}
        </p>

        {/* Current Password */}
        {hasPassword ? (
          <Controller
            name="currentPassword"
            render={({ field, fieldState }) => (
              <>
                <Label>Current Password</Label>
                <PasswordInput
                  {...field}
                  disabled={mutation.isPending}
                  autoComplete="current-password"
                  placeholder="Current Password"
                />

                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />
        ) : null}

        {/* New Password */}
        <Controller
          name="newPassword"
          render={({ field, fieldState }) => (
            <>
              <Label>New Password</Label>
              <PasswordInput
                {...field}
                disabled={mutation.isPending}
                autoComplete="new-password"
                placeholder="New Password"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

        {/* Confirm Password */}
        <Controller
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <>
              <Label>Confirm Password</Label>
              <PasswordInput
                {...field}
                disabled={mutation.isPending}
                autoComplete="new-password"
                placeholder="Confirm Password"
              />

              <FieldStateError fieldState={fieldState} />
            </>
          )}
        />

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

export default function ProfileEditor() {
  const { farmerMode, telegramClient, updateTelegramUser } = useAppContext();
  const [profile, setProfile] = useState(null);
  const ref = telegramClient.ref;
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
    },
  });

  const mutation = useMutation({
    mutationKey: ["profile-editor", "update-profile"],
    mutationFn: async (data) => {
      if (!ref.current) throw new Error("Telegram client is not initialized");
      await ref.current.execute(() => ref.current.updateProfile(data));
      return data;
    },
    onSuccess: (data) => {
      setProfile(data);
      updateTelegramUser(true);
    },
  });

  const handleSubmit = async (data) => {
    await toast.promise(mutation.mutateAsync(data), {
      loading: "Updating profile...",
      success: "Profile updated successfully!",
      error: (err) => `Error updating profile: ${err.message}`,
    });
  };

  useEffect(() => {
    if (farmerMode !== "session") return;
    /** @type {import("@purrfect/shared/lib/BaseTelegramWebClient.js").default} */
    const client = ref.current;

    /** Fetch Profile */
    client
      .execute(() => client.getMe())
      .then((profile) => {
        console.log("Fetched profile:", profile);
        setProfile(profile);
        form.reset({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          username: profile.username || "",
        });
      });
  }, [farmerMode, ref, setProfile]);

  if (!profile) {
    return <div className="p-2 text-center">Loading profile...</div>;
  }

  return (
    <>
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-2 p-2"
        >
          {/* First Name */}
          <Controller
            name="firstName"
            render={({ field, fieldState }) => (
              <>
                <Label>First Name</Label>
                <Input
                  {...field}
                  disabled={mutation.isPending}
                  autoComplete="off"
                  placeholder="First Name"
                />

                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* Last Name */}
          <Controller
            name="lastName"
            render={({ field, fieldState }) => (
              <>
                <Label>Last Name</Label>
                <Input
                  {...field}
                  disabled={mutation.isPending}
                  autoComplete="off"
                  placeholder="Last Name"
                />

                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* Username */}
          <Controller
            name="username"
            render={({ field, fieldState }) => (
              <>
                <Label>Username</Label>
                <Input
                  {...field}
                  disabled={mutation.isPending}
                  autoComplete="off"
                  placeholder="Username"
                />

                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* Update Profile Button */}
          <PrimaryButton
            type="submit"
            disabled={mutation.isPending}
            className="mt-4"
          >
            {mutation.isPending ? "Updating..." : "Update Profile"}
          </PrimaryButton>
        </form>
      </FormProvider>

      {/* 2FA */}
      <TwoFaEditor client={ref.current} />
    </>
  );
}
