import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import * as yup from "yup";
import { Controller, FormProvider, useForm } from "react-hook-form";
import PrimaryButton from "@/components/PrimaryButton";
import useCloudPasswordUpdateMutation from "@/hooks/useCloudPasswordUpdateMutation";
import { yupResolver } from "@hookform/resolvers/yup";
import Input from "@/components/Input";
import toast from "react-hot-toast";

/** Schema */
const schema = yup
  .object({
    ["current_password"]: yup.string().required().label("Current Password"),
    ["new_password"]: yup.string().required().label("New Password"),
  })
  .required();

export default function CloudPasswordUpdate() {
  const passwordUpdateMutation = useCloudPasswordUpdateMutation();
  const isPending = passwordUpdateMutation.isPending;

  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ["current_password"]: "",
      ["new_password"]: "",
    },
  });

  /** Handle Form Submit */
  const handleFormSubmit = (data) => {
    passwordUpdateMutation.mutateAsync(data, {
      onError(error) {
        /** Set Errors */
        Object.entries(error.response?.data?.errors || {}).forEach(([k, v]) =>
          form.setError(k, {
            message: v[0],
          })
        );

        /** Toast Error */
        toast.error(error.response?.data.message || "An error occurred!");
      },
      onSuccess() {
        /** Reset Form */
        form.reset();

        /** Toast */
        toast.success("Password updated!");
      },
    });
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className={cn(
          "fixed inset-0 z-40",
          "flex items-center justify-center",
          "p-4 overflow-auto bg-black/50"
        )}
      >
        <Dialog.Content
          className={cn(
            "flex flex-col w-full max-w-sm",
            "gap-2 p-4 bg-white dark:bg-neutral-800 rounded-xl"
          )}
        >
          {/* Title */}
          <Dialog.Title
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "font-bold text-center"
            )}
          >
            Update Password
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="px-2 text-center text-neutral-500 dark:text-neutral-300">
            Set a new password
          </Dialog.Description>

          <FormProvider {...form}>
            <form
              onSubmit={form.handleSubmit(handleFormSubmit)}
              className="flex flex-col gap-2"
            >
              {/* Current Password */}
              <Controller
                disabled={isPending}
                name="current_password"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="off"
                      placeholder="Current Password"
                    />
                    {fieldState.error?.message ? (
                      <p className="text-red-500">
                        {fieldState.error?.message}
                      </p>
                    ) : null}
                  </>
                )}
              />

              {/* New Password */}
              <Controller
                disabled={isPending}
                name="new_password"
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      type="password"
                      autoComplete="off"
                      placeholder="New Password"
                    />
                    {fieldState.error?.message ? (
                      <p className="text-red-500">
                        {fieldState.error?.message}
                      </p>
                    ) : null}
                  </>
                )}
              />

              {/* Submit Button */}
              <PrimaryButton type="submit" disabled={isPending}>
                {isPending ? "Updating..." : "Update"}
              </PrimaryButton>
            </form>
          </FormProvider>

          {/* Cancel Button */}
          <Dialog.Close
            className={cn(
              "px-4 py-2 bg-neutral-200 dark:bg-neutral-900 rounded-lg"
            )}
          >
            Cancel
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Overlay>
    </Dialog.Portal>
  );
}
