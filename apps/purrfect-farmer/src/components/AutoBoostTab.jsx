import { Controller, useForm } from "react-hook-form";

import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import Alert from "./Alert";
import { FaFire } from "react-icons/fa6";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Input from "./Input";
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
    amount: yup
      .string()
      .nullable()
      .label("Amount")
      .test(
        "positive-number",
        "Enter a valid amount",
        (value) => !value || Number(value) > 0,
      ),
    freeze: yup.boolean().required().label("Freeze"),
    onlyConnectWallet: yup.boolean().required().label("Only Connect Wallet"),
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
      delay: 0,
      difference: 5,
      amount: "",
      freeze: true,
      onlyConnectWallet: false,
      reuseLastAmount: false,
      withdrawAfterBoost: false,
      requalify: "boost",
      ignorePending: false,
      retainFunds: false,
      runFarmer: false,
      repeat: false,
      repeatInterval: 15,
    },
  });

  const { config, password, master, accounts } = useAuto();
  const withdrawAfterBoost = form.watch("withdrawAfterBoost");
  const amount = form.watch("amount");
  const onlyConnectWallet = form.watch("onlyConnectWallet");
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
              Boost dispatched to Cloud. Check your notifications for progress.
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
            Boosts in Cloud. {config.token} moves from the master wallet into
            each selected account, so keep enough TON there.
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
                  Delay between accounts
                </p>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Only Connect Wallet */}
          <Controller
            control={form.control}
            name="onlyConnectWallet"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Only Connect Wallet</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Connect each account's wallet without sending any{" "}
                  {config.token}.
                </p>
                <LabelToggle {...field} checked={field.value}>
                  Skip boosting, only connect
                </LabelToggle>
                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* These only have anything to do when the run sends tokens */}
          {!onlyConnectWallet ? (
            <>
              {/* Amount the run works with, instead of the master's whole balance */}
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1">
                    <Label>Amount</Label>
                    <Input
                      {...field}
                      autoComplete="off"
                      inputMode="decimal"
                      placeholder="Leave empty to use the master's full balance"
                    />

                    {/* Info */}
                    <p className="text-center text-neutral-500 dark:text-neutral-400">
                      Boost against this much {config.token} instead of
                      everything master holds.
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
                      Boosts between {100 - field.value}-100% of{" "}
                      {amount
                        ? `${amount} ${config.token}`
                        : `the master's ${config.token} balance`}
                      .
                    </p>

                    <FieldStateError fieldState={fieldState} />
                  </div>
                )}
              />
            </>
          ) : null}

          {/* Freeze */}
          <Controller
            control={form.control}
            name="freeze"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Freeze</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Freeze each account after boosting. Repeat always freezes.
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
                  Run a full farming session after connecting. Off is much
                  faster.
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
                  Withdraw each account's full balance once its boost lands.
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
                      Withdrawing spends buyer standing. A second pass restores
                      it but roughly doubles the run.
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
                      Withdraw even when a withdrawal is still in flight.
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

          {!onlyConnectWallet ? (
            <>
              {/* Reuse last amount */}
              <Controller
                control={form.control}
                name="reuseLastAmount"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1">
                    <Label>Reuse last amount</Label>

                    <p className="text-center text-neutral-500 dark:text-neutral-400">
                      Boost each account with the amount it last received,
                      capped at master's balance.
                    </p>
                    <LabelToggle {...field} checked={field.value}>
                      Reuse each account's last amount
                    </LabelToggle>
                    <FieldStateError fieldState={fieldState} />
                  </div>
                )}
              />

              {/* Retain Funds */}
              <Controller
                control={form.control}
                name="retainFunds"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1">
                    <Label>Retain Funds</Label>

                    <p className="text-center text-neutral-500 dark:text-neutral-400">
                      Leave funds in the last boosted account instead of
                      returning them to master.
                    </p>
                    <LabelToggle {...field} checked={field.value}>
                      Keep funds in the last account
                    </LabelToggle>
                    <FieldStateError fieldState={fieldState} />
                  </div>
                )}
              />
            </>
          ) : null}

          {/* Repeat */}
          <Controller
            control={form.control}
            name="repeat"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Repeat</Label>

                <p className="text-center text-neutral-500 dark:text-neutral-400">
                  Repeat the boost, freezing accounts each round, until
                  cancelled.
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
                  Interval between repeats
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
