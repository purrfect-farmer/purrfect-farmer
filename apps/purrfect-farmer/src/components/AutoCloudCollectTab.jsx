import { Controller, useForm, useWatch } from "react-hook-form";

import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import Alert from "./Alert";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Input from "./Input";
import Label from "./Label";
import { LuMerge } from "react-icons/lu";
import { memo } from "react";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudCollectionMutation from "@/hooks/useAutoCloudCollectionMutation";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** An optional amount, empty or zero and up */
const optionalAmount = (label) =>
  yup
    .string()
    .label(label)
    .test(
      "non-negative-number",
      "Enter a valid amount",
      (value) =>
        !value || (Number.isFinite(Number(value)) && Number(value) >= 0),
    );

const schema = yup
  .object({
    retainMin: optionalAmount("Retain Min"),
    retainMax: optionalAmount("Retain Max").test(
      "not-below-min",
      "Max must not be below min",
      (value, { parent }) =>
        !value ||
        !parent.retainMin ||
        Number(value) >= Number(parent.retainMin),
    ),
    minCollect: optionalAmount("Minimum to collect"),
  })
  .required();

/** What the retain fields leave on each account, in words */
function describeRetain(min, max, unit) {
  if (min && max && min !== max) {
    return `Leaves a random ${min}-${max} ${unit} on each account.`;
  }
  if (min || max) return `Leaves ${min || max} ${unit} on each account.`;
  return `Collects everything. Set a range to leave a random amount behind.`;
}

/** The retain range in words, re-rendering alone as its fields change */
const RetainDescription = memo(function RetainDescription({ control, unit }) {
  const [retainMin, retainMax] = useWatch({
    control,
    name: ["retainMin", "retainMax"],
  });

  return (
    <p className="text-center text-neutral-500 dark:text-neutral-400">
      {describeRetain(retainMin, retainMax, unit)}
    </p>
  );
});

export default function AutoCloudCollectTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      retainMin: "",
      retainMax: "",
      minCollect: "",
    },
  });

  const { config, password, master, accounts } = useAuto();
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useAutoCloudCollectionMutation();

  const unit = config.native ? "TON" : config.token;

  const handleCollect = async (data) => {
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
        success: "Successfully dispatched collection request!",
        error: "Failed to dispatch collection request!",
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
              Collection dispatched to Cloud. Check your notifications for
              progress.
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

      {/* Form */}
      {!mutation.isSuccess && !mutation.isError && (
        <form
          onSubmit={form.handleSubmit(handleCollect)}
          className="flex flex-col gap-2"
        >
          <Alert variant="info">
            Collects in Cloud. Sends TON from master, returns any {config.token}{" "}
            found, then returns leftover TON.
          </Alert>

          {/* Retain range, a random amount within it left on each account */}
          <div className="flex flex-col gap-1">
            <Label>Retain ({unit})</Label>
            <div className="grid grid-cols-2 gap-2">
              {["retainMin", "retainMax"].map((name) => (
                <Controller
                  key={name}
                  control={form.control}
                  name={name}
                  render={({ field, fieldState }) => (
                    <div className="flex flex-col gap-1 min-w-0">
                      <Input
                        {...field}
                        disabled={mutation.isPending}
                        autoComplete="off"
                        inputMode="decimal"
                        placeholder={name === "retainMin" ? "Min" : "Max"}
                      />
                      <FieldStateError fieldState={fieldState} />
                    </div>
                  )}
                />
              ))}
            </div>

            <RetainDescription control={form.control} unit={unit} />
          </div>

          {/* Minimum to collect, so dust is not worth the gas */}
          <Controller
            control={form.control}
            name="minCollect"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Minimum to collect ({unit})</Label>
                <Input
                  {...field}
                  disabled={mutation.isPending}
                  autoComplete="off"
                  inputMode="decimal"
                  placeholder="Leave empty to collect any amount"
                />

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  {field.value
                    ? `Skips accounts with less than ${field.value} ${unit} to collect.`
                    : "Skips accounts with less than this to collect."}
                </p>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          <AutoStickyContainer>
            <PrimaryButton type="submit" disabled={mutation.isPending}>
              <LuMerge className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Collect"}
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
