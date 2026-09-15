import { Controller, useForm } from "react-hook-form";

import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import Alert from "./Alert";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import LabelToggle from "./LabelToggle";
import { MdCheckCircle } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudStatusMutation from "@/hooks/useAutoCloudStatusMutation";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    includeFrozen: yup.boolean().required().label("Include Frozen"),
  })
  .required();

export default function AutoStatusTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      includeFrozen: false,
    },
  });

  const { password, master, accounts } = useAuto();
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useAutoCloudStatusMutation();

  const handleStatus = async (data) => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    await toast.promise(
      mutation.mutateAsync({
        ...data,
        password,
        master,
        accounts: selectedAccounts,
      }),
      {
        loading: "Dispatching...",
        success: "Successfully dispatched status request!",
        error: "Failed to dispatch status request!",
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <AutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant={"success"}>
              Status request was successfully dispatched to Cloud. Kindly check
              your notifications for progress.
            </Alert>

            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </AutoStickyContainer>
      )}

      {mutation.isError && (
        <AutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant="danger">{mutation.error.message}</Alert>
            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </AutoStickyContainer>
      )}

      {/* Button */}
      {!mutation.isSuccess && !mutation.isError && (
        <form
          onSubmit={form.handleSubmit(handleStatus)}
          className="flex flex-col gap-2"
        >
          <Alert variant="info">
            Request for account status in Cloud. Details include mined balance,
            risks and wallet information.
          </Alert>

          {/* Include Frozen */}
          <Controller
            control={form.control}
            name="includeFrozen"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Include Frozen</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Frozen accounts are skipped by default. Enabling this reads
                  them too. Every account whose status is read is activated
                  afterwards, so it resumes farming.
                </p>
                <LabelToggle {...field} checked={field.value}>
                  Include frozen accounts
                </LabelToggle>
                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          <AutoStickyContainer>
            <PrimaryButton type="submit" disabled={mutation.isPending}>
              <MdCheckCircle className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Status"}
            </PrimaryButton>
          </AutoStickyContainer>
        </form>
      )}

      {/* Accounts Chooser */}
      <AutoAccountsChooser
        {...selector}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </div>
  );
}
