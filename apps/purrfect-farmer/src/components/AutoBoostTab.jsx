import { Controller, useForm } from "react-hook-form";

import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import Alert from "./Alert";
import { FaFire } from "react-icons/fa6";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import Slider from "./Slider";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudBoostMutation from "@/hooks/useAutoCloudBoostMutation";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";
import LabelToggle from "./LabelToggle";

const schema = yup
  .object({
    delay: yup.number().required().label("Delay"),
    difference: yup.number().required().label("Difference"),
    freeze: yup.boolean().required().label("Freeze"),
    reuseLastAmount: yup.boolean().required().label("Reuse Last Amount"),
    withdrawAfterBoost: yup.boolean().required().label("Withdraw"),
    requalify: yup
      .string()
      .required()
      .oneOf(["off", "resync", "boost"])
      .label("Requalify"),
    ignorePending: yup.boolean().label("Ignore Pending"),
    retainFunds: yup.boolean().required().label("Retain Funds"),
    runFarmer: yup.boolean().required().label("Run Farmer"),
    repeat: yup.boolean().required().label("Repeat"),
    repeatInterval: yup.number().required().min(1).label("Repeat Interval"),
  })
  .required();

export default function AutoBoostTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      delay: 1,
      difference: 5,
      freeze: false,
      reuseLastAmount: false,
      withdrawAfterBoost: false,
      requalify: "boost",
      ignorePending: false,
      retainFunds: false,
      runFarmer: true,
      repeat: false,
      repeatInterval: 15,
    },
  });

  const { config, password, master, accounts } = useAuto();
  const withdrawAfterBoost = form.watch("withdrawAfterBoost");
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useAutoCloudBoostMutation();

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
        <AutoStickyContainer>
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
          onSubmit={form.handleSubmit(handleBoost)}
          className="flex flex-col gap-2"
        >
          <Alert variant="info">
            Perform boost in Cloud. {config.token} will be transferred from the
            master wallet into each selected account. Ensure the master wallet
            has enough TON for operations.
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
                  min={0}
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
                  available {config.token} in the master wallet. E.g a
                  difference of {field.value}% would boost between{" "}
                  {100 - field.value}-100%
                </p>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Reuse last amount */}
          <Controller
            control={form.control}
            name="reuseLastAmount"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Reuse last amount</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Enabling this will boost each account with the same amount it
                  last received, instead of rolling a new one from the
                  difference. Accounts that have never been boosted here fall
                  back to the difference, and an amount the master can no longer
                  cover is capped at whatever it holds.
                </p>
                <LabelToggle {...field} checked={field.value}>
                  Reuse each account's last amount
                </LabelToggle>
                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Freeze */}
          <Controller
            control={form.control}
            name="freeze"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Freeze</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Enabling this will freeze each account after it is boosted, so
                  it stops farming until you activate it again. Repeating always
                  freezes, whether or not this is enabled.
                </p>
                <LabelToggle {...field} checked={field.value}>
                  Freeze accounts after boost
                </LabelToggle>
                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Run Farmer */}
          <Controller
            control={form.control}
            name="runFarmer"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Run Farmer</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Enabling this will run a full farming session on each account
                  after its wallet is connected. Disable it to only connect the
                  wallets, which is much faster.
                </p>
                <LabelToggle {...field} checked={field.value}>
                  Run farmer after connecting
                </LabelToggle>
                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Withdraw */}
          <Controller
            control={form.control}
            name="withdrawAfterBoost"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Withdraw</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Enabling this will withdraw each account's full balance right
                  after its boost is confirmed to have landed. Accounts with a
                  pending or flagged withdrawal are skipped, and so are accounts
                  whose boost never settled.
                </p>
                <LabelToggle {...field} checked={field.value}>
                  Withdraw after boost
                </LabelToggle>
                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* These only have anything to do when the run withdraws */}
          {withdrawAfterBoost ? (
            <>
              <Controller
                control={form.control}
                name="requalify"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1">
                    <Label>Requalify after withdrawing</Label>

                    <p className="text-center text-neutral-500 dark:text-neutral-400">
                      Withdrawing spends an account's DEX buyer standing, and
                      the drop reviews the payout later against whatever the
                      account looks like then. A second boost pass sends the
                      pool round the withdrawn accounts again, each from a
                      wallet that did not fund it this run, so they end the run
                      qualified. It roughly doubles how long a run takes.
                    </p>

                    <Select {...field}>
                      <Select.Item value="off">
                        Off - leave it alone
                      </Select.Item>
                      <Select.Item value="resync">
                        Re-sync wallet - free, no tokens move
                      </Select.Item>
                      <Select.Item value="boost">
                        Second boost pass - boost again from a new sender
                      </Select.Item>
                    </Select>

                    <FieldStateError fieldState={fieldState} />
                  </div>
                )}
              />

              {/* Ignore Pending */}
              <Controller
                control={form.control}
                name="ignorePending"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1">
                    <Label>Ignore Pending</Label>

                    <p className="text-center text-neutral-500 dark:text-neutral-400">
                      An account with a withdrawal still in flight is skipped by
                      default. Enabling this withdraws anyway, which puts a
                      stale pending withdrawal back on the queue.
                    </p>
                    <LabelToggle {...field} checked={field.value}>
                      Withdraw despite a pending withdrawal
                    </LabelToggle>
                    <FieldStateError fieldState={fieldState} />
                  </div>
                )}
              />
            </>
          ) : null}

          {/* Retain Funds */}
          <Controller
            control={form.control}
            name="retainFunds"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Retain Funds</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Enabling this will leave the funds in the last boosted account
                  instead of transferring them back into the master wallet. With
                  Repeat enabled, the next boost continues from that account.
                </p>
                <LabelToggle {...field} checked={field.value}>
                  Keep funds in the last account
                </LabelToggle>
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
                  max={72}
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
      <AutoAccountsChooser
        {...selector}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </div>
  );
}
