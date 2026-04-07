import { Controller, FormProvider, useForm } from "react-hook-form";

import ATFAutoProgress from "./ATFAutoProgress";
import Alert from "./Alert";
import Button from "./Button";
import FieldStateError from "./FieldStateError";
import Input from "./Input";
import Label from "./Label";
import bcrypt from "bcryptjs";
import { encryption } from "@/services/encryption";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoProgress from "@/hooks/useATFAutoProgress";
import { useMutation } from "@tanstack/react-query";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    currentPassword: yup.string().required().label("Current Password"),
    newPassword: yup.string().required().label("New Password"),
  })
  .required();

export default function ATFAutoSettingsTab() {
  const {
    master,
    password,
    accounts,
    storeMaster,
    storeAccounts,
    setPassword,
  } = useATFAuto();
  const { target, progress, setTarget, resetProgress, incrementProgress } =
    useATFAutoProgress();

  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const mutation = useMutation({
    mutationKey: ["atf-auto-change-password"],
    mutationFn: async ({ currentPassword, newPassword }) => {
      resetProgress();

      // Total items to re-encrypt: master + all accounts
      setTarget(1 + accounts.length);

      // Re-encrypt master phrase
      const masterPhrase = await encryption.decryptData({
        ...master.encryptedWalletPhrase,
        password: currentPassword,
        asText: true,
      });

      const encryptedWalletPhrase = await encryption.encryptData({
        data: masterPhrase,
        password: newPassword,
      });

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      storeMaster({
        ...master,
        encryptedWalletPhrase,
        hashedPassword,
      });

      incrementProgress();

      // Re-encrypt all account phrases
      const updatedAccounts = [];
      for (const account of accounts) {
        const phrase = await encryption.decryptData({
          ...account.encryptedPhrase,
          password: currentPassword,
          asText: true,
        });

        const encryptedPhrase = await encryption.encryptData({
          data: phrase,
          password: newPassword,
        });

        updatedAccounts.push({
          ...account,
          encryptedPhrase,
        });

        incrementProgress();
      }

      storeAccounts(updatedAccounts);

      // Update in-memory password
      setPassword(newPassword);

      return { status: true };
    },
  });

  const handleFormSubmit = async (data) => {
    if (data.currentPassword !== password) {
      form.setError("currentPassword", {
        type: "validate",
        message: "Current password is incorrect.",
      });
      return;
    }

    await mutation.mutateAsync(data);
    form.reset();
    toast.success("Password changed successfully.");
  };

  const handleLogout = () => {
    setPassword(null);
    toast.success("Logged out.");
  };

  return (
    <div className="flex flex-col gap-2 px-2">
      {/* Change Password */}
      <Alert variant={"info"}>
        Changing your password will re-encrypt all stored wallet phrases.
      </Alert>

      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Current Password */}
          <Controller
            control={form.control}
            name="currentPassword"
            render={({ field, fieldState }) => (
              <>
                <Label>Current Password</Label>
                <Input
                  {...field}
                  disabled={form.formState.isSubmitting}
                  type="password"
                  autoComplete="off"
                  placeholder="Current Password"
                />
                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          {/* New Password */}
          <Controller
            control={form.control}
            name="newPassword"
            render={({ field, fieldState }) => (
              <>
                <Label>New Password</Label>
                <Input
                  {...field}
                  disabled={form.formState.isSubmitting}
                  type="password"
                  autoComplete="off"
                  placeholder="New Password"
                />
                <FieldStateError fieldState={fieldState} />
              </>
            )}
          />

          <Button disabled={form.formState.isSubmitting} type="submit">
            {form.formState.isSubmitting ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </FormProvider>

      {/* Progress */}
      {form.formState.isSubmitting && (
        <ATFAutoProgress max={target} current={progress} />
      )}

      {/* Or */}
      <p className="text-center text-neutral-500 dark:text-neutral-400">OR</p>

      {/* Logout */}
      <Button variant="danger" onClick={handleLogout} className="w-full">
        Logout
      </Button>
    </div>
  );
}
