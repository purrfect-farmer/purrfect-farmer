import * as yup from "yup";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";
import useCloudManagerPasswordUpdateMutation from "@/hooks/useCloudManagerPasswordUpdateMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import CloudCenteredDialog from "./CloudCenteredDialog";

/** Schema */
const schema = yup
  .object({
    ["currentPassword"]: yup.string().required().label("Current Password"),
    ["newPassword"]: yup.string().required().label("New Password"),
  })
  .required();

export default function CloudPasswordUpdate() {
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ["currentPassword"]: "",
      ["newPassword"]: "",
    },
  });

  const passwordUpdateMutation = useCloudManagerPasswordUpdateMutation(form);
  const isPending = passwordUpdateMutation.isPending;

  /** Handle Form Submit */
  const handleFormSubmit = (data) => {
    passwordUpdateMutation.mutateAsync(data, {
      onSuccess() {
        /** Reset Form */
        form.reset();

        /** Toast */
        toast.success("Password updated!");
      },
    });
  };

  return (
    <CloudCenteredDialog
      title={"Update Password"}
      description={"Set a new password"}
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* Current Password */}
          <Controller
            disabled={isPending}
            name="currentPassword"
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  type="password"
                  autoComplete="off"
                  placeholder="Current Password"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </>
            )}
          />

          {/* New Password */}
          <Controller
            disabled={isPending}
            name="newPassword"
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  type="password"
                  autoComplete="off"
                  placeholder="New Password"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </>
            )}
          />

          {/* Submit Button */}
          <PrimaryButton className="my-1" type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update"}
          </PrimaryButton>
        </form>
      </FormProvider>
    </CloudCenteredDialog>
  );
}
