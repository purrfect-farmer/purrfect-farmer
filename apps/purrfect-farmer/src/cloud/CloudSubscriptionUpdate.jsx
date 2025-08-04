import * as yup from "yup";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";
import useCloudManagerMemberSubscriptionMutation from "@/hooks/useCloudManagerMemberSubscriptionMutation";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { yupResolver } from "@hookform/resolvers/yup";

import CloudCenteredDialog from "./CloudCenteredDialog";

/** Schema */
const schema = yup
  .object({
    ["id"]: yup.string().required().label("User ID"),
    ["date"]: yup.string().nullable().label("Date"),
  })
  .required();

export default function CloudSubscriptionUpdate() {
  const queryClient = useQueryClient();
  /** Form */
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      ["id"]: "",
      ["date"]: "",
    },
  });

  const subscriptionMutation = useCloudManagerMemberSubscriptionMutation(form);
  const isPending = subscriptionMutation.isPending;

  /** Handle Form Submit */
  const handleFormSubmit = (data) => {
    subscriptionMutation.mutateAsync(data, {
      onSuccess() {
        /** Reset Form */
        form.reset();

        /** Toast */
        toast.success("Subscription updated!");

        /** Refetch Queries */
        queryClient.refetchQueries({
          queryKey: ["app", "cloud"],
        });
      },
    });
  };

  return (
    <CloudCenteredDialog
      title={"Subscription"}
      description={"Create or update member's subscription"}
    >
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(handleFormSubmit)}
          className="flex flex-col gap-2"
        >
          {/* User ID */}
          <Controller
            disabled={isPending}
            name="id"
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  autoComplete="off"
                  placeholder="Telegram User ID"
                />
                {fieldState.error?.message ? (
                  <p className="text-red-500">{fieldState.error?.message}</p>
                ) : null}
              </>
            )}
          />

          {/* Date */}
          <Controller
            disabled={isPending}
            name="date"
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  type="date"
                  autoComplete="off"
                  placeholder="Expiration Date"
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
