import { Controller, useForm } from "react-hook-form";

import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoStickyContainer from "./ATFAutoStickyContainer";
import Alert from "./Alert";
import { FaFire } from "react-icons/fa6";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import Slider from "./Slider";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoAccountsSelector from "@/hooks/useATFAutoAccountsSelector";
import useATFAutoCloudBoostMutation from "@/hooks/useATFAutoCloudBoostMutation";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";
import LabelToggle from "./LabelToggle";

const schema = yup
  .object({
    delay: yup.number().required().min(1).label("Delay"),
    difference: yup.number().required().label("Difference"),
    repeat: yup.boolean().required().label("Repeat"),
    repeatInterval: yup.number().required().min(1).label("Repeat Interval"),
  })
  .required();

export default function ATFAutoBoostTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      delay: 2,
      difference: 20,
      repeat: false,
      repeatInterval: 15,
    },
  });

  const { password, master, accounts } = useATFAuto();
  const selector = useATFAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useATFAutoCloudBoostMutation();

  const handleBoost = async (data) => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    console.log("Form submitted with data:", data);

    await toast.promise(
      mutation.mutateAsync({
        ...data,
        password,
        master,
        accounts: selectedAccounts,
      }),
      {
        loading: "Dispatching...",
        success: "Successfully dispatched boost request!",
        error: "Failed to dispatch boost request!",
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
              Boost request was successfully dispatched to Cloud. Kindly check
              your notifications for progress.
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
          onSubmit={form.handleSubmit(handleBoost)}
          className="flex flex-col gap-2"
        >
          <Alert variant="info">
            Perform boost in Cloud. ATF will be transferred from the master
            wallet into each selected account. Ensure the master wallet has
            enough TON for operations.
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
                  This is the difference in the amount to boost based on the
                  available ATF in the master wallet. E.g a difference of{" "}
                  {field.value}% would boost between {100 - field.value}-100%
                </p>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Repeat */}
          <Controller
            control={form.control}
            name="repeat"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Repeat</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Enabling this will repeat the boost operation and freeze the
                  accounts after each boost until the operation is cancelled.
                </p>
                <LabelToggle {...field}>Freeze and repeat</LabelToggle>
                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Repeat Interval */}
          <Controller
            control={form.control}
            name="repeatInterval"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>
                  Repeat Interval in hours{" "}
                  <span className="text-blue-500 dark:text-blue-400">
                    ({field.value}h)
                  </span>
                </Label>
                <Slider
                  step={1}
                  min={1}
                  max={24}
                  value={[field.value]}
                  onValueChange={(newValue) => field.onChange(newValue[0])}
                />

                {/* Info */}
                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Configure the interval between repeats
                </p>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          <PrimaryButton type="submit" disabled={mutation.isPending}>
            <FaFire className="size-4" />{" "}
            {mutation.isPending ? "Dispatching..." : "Boost"}
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
