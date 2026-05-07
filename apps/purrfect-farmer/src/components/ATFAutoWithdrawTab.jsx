import { Controller, useForm } from "react-hook-form";

import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoStickyContainer from "./ATFAutoStickyContainer";
import Alert from "./Alert";
import { FaDollarSign } from "react-icons/fa6";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Input from "./Input";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import Slider from "./Slider";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoAccountsSelector from "@/hooks/useATFAutoAccountsSelector";
import useATFAutoCloudWithdrawalMutation from "@/hooks/useATFAutoCloudWithdrawalMutation";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    delay: yup.number().required().min(1).label("Delay"),
    difference: yup.number().required().label("Difference"),
    amount: yup.string().nullable().label("Amount"),
  })
  .required();

export default function ATFAutoWithdrawTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      delay: 3,
      difference: 10,
      amount: "",
    },
  });

  const { password, master, accounts } = useATFAuto();
  const selector = useATFAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useATFAutoCloudWithdrawalMutation();

  const handleWithdraw = async (data) => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    console.log(data);

    await toast.promise(
      mutation.mutateAsync({
        ...data,
        password,
        master,
        accounts: selectedAccounts,
      }),
      {
        loading: "Dispatching...",
        success: "Successfully dispatched withdrawal request!",
        error: "Failed to dispatch withdrawal request!",
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <ATFAutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant={"success"}>
              Withdrawal request was successfully dispatched to Cloud. Kindly
              check your notifications for progress.
            </Alert>

            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </ATFAutoStickyContainer>
      )}

      {mutation.isError && (
        <ATFAutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant="danger">{mutation.error.message}</Alert>
            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </ATFAutoStickyContainer>
      )}

      {/* Button */}
      {!mutation.isSuccess && !mutation.isError && (
        <form
          onSubmit={form.handleSubmit(handleWithdraw)}
          className="flex flex-col gap-3 p-2"
        >
          <Alert variant="info">
            Perform withdrawal in Cloud. Accounts that have mined up to the
            minimum account (<strong>500 ATF in Pool Wallet</strong>) will be
            processed.
          </Alert>

          {/* Delay */}
          <Controller
            control={form.control}
            name="delay"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>
                  Delay in minutes{" "}
                  <span className="text-blue-500 dark:text-blue-400">
                    ({field.value}m)
                  </span>
                </Label>
                <Slider
                  step={1}
                  min={1}
                  max={30}
                  value={[field.value]}
                  onValueChange={(newValue) => field.onChange(newValue[0])}
                />

                {/* Info */}
                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Configure the delay between accounts
                </p>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Difference */}
          <Controller
            control={form.control}
            name="difference"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>
                  Difference
                  <span className="text-blue-500 dark:text-blue-400">
                    ({field.value}%)
                  </span>
                </Label>

                <Slider
                  step={1}
                  min={0}
                  max={50}
                  value={[field.value]}
                  onValueChange={(newValue) => field.onChange(newValue[0])}
                />

                {/* Info */}
                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  This is the difference in the amount to withdraw based on the
                  available balance. E.g a difference of {field.value}% would
                  withdraw between {100 - field.value}-100%
                </p>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Max amount to withdraw */}
          <Controller
            control={form.control}
            name="amount"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Maximum amount</Label>
                <Input
                  {...field}
                  autoComplete="off"
                  placeholder="Leave empty to withdraw up to available balance"
                />

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          <PrimaryButton type="submit" disabled={mutation.isPending}>
            <FaDollarSign className="size-4" />{" "}
            {mutation.isPending ? "Dispatching..." : "Withdraw"}
          </PrimaryButton>
        </form>
      )}

      {/* Accounts Chooser */}
      <ATFAutoAccountsChooser
        {...selector}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </div>
  );
}
