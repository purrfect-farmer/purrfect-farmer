import { Controller, useForm } from "react-hook-form";

import Alert from "./Alert";
import AutoStickyContainer from "./AutoStickyContainer";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import LabelToggle from "./LabelToggle";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import Slider from "./Slider";
import { FaPlay, FaStop } from "react-icons/fa6";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoCloudCultivateCancellationMutation from "@/hooks/useAutoCloudCultivateCancellationMutation";
import useAutoCloudCultivateMutation from "@/hooks/useAutoCloudCultivateMutation";
import useAutoCloudCultivateStatusQuery from "@/hooks/useAutoCloudCultivateStatusQuery";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    cultivateInterval: yup
      .number()
      .required()
      .min(5)
      .label("Cultivate Interval"),
    delay: yup.number().required().min(0).label("Delay"),
    difference: yup.number().required().min(0).max(50).label("Difference"),
    reuseLastAmount: yup.boolean().label("Reuse Last Amount"),
    includeFrozen: yup.boolean().label("Include Frozen"),
    includeRevoked: yup.boolean().label("Include Revoked"),
    requalify: yup
      .string()
      .required()
      .oneOf(["off", "resync", "boost"])
      .label("Requalify"),
    ignorePending: yup.boolean().label("Ignore Pending"),
    freeze: yup.boolean().label("Freeze"),
    runFarmer: yup.boolean().label("Run Farmer"),
  })
  .required();

export default function AutoCultivateTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      cultivateInterval: 10,
      delay: 5,
      difference: 5,
      reuseLastAmount: false,
      includeFrozen: false,
      includeRevoked: false,
      requalify: "boost",
      ignorePending: false,
      freeze: false,
      runFarmer: true,
    },
  });

  const { config, password, master, accounts } = useAuto();

  const statusQuery = useAutoCloudCultivateStatusQuery();
  const cultivateMutation = useAutoCloudCultivateMutation();
  const cancelMutation = useAutoCloudCultivateCancellationMutation();

  const status = statusQuery.data;
  const isPending = cultivateMutation.isPending || cancelMutation.isPending;

  /** The loop boosts from the master, so it needs the same payload Load sends */
  const payload = (data) => ({
    ...data,
    password,
    master,
    accounts,
  });

  const handleCultivate = async (data) => {
    await toast.promise(cultivateMutation.mutateAsync(payload(data)), {
      loading: "Dispatching...",
      success: "Cultivation started!",
      error: "Failed to start cultivation!",
    });

    statusQuery.refetch();
  };

  const handleStop = async () => {
    await toast.promise(cancelMutation.mutateAsync({}), {
      loading: "Stopping...",
      success: "Cultivation stopping...",
      error: "Failed to stop cultivation!",
    });

    statusQuery.refetch();
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      <Alert variant="info">
        Boosts each loaded wallet, waits for the drop to settle, then withdraws.
        Verified accounts are skipped.
      </Alert>

      {/* What the server currently holds */}
      {status ? (
        <AutoStickyContainer className="z-10">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500 dark:text-neutral-400">
                Loaded wallets
              </span>
              <span className="font-bold">{status.vault.accounts}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500 dark:text-neutral-400">
                Cultivating
              </span>
              <span
                className={
                  status.running
                    ? "font-bold text-green-500"
                    : "font-bold text-neutral-500 dark:text-neutral-400"
                }
              >
                {status.running ? `Every ${status.interval}m` : "Stopped"}
              </span>
            </div>
          </div>
        </AutoStickyContainer>
      ) : null}

      {status && !status.vault.loaded ? (
        <Alert variant="warning">
          No wallets loaded. Load them from the Load tab after every restart.
        </Alert>
      ) : null}

      <form
        onSubmit={form.handleSubmit(handleCultivate)}
        className="flex flex-col gap-2"
      >
        {/* Cultivate interval */}
        <Controller
          control={form.control}
          name="cultivateInterval"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Label>
                Cultivate every{" "}
                <span className="text-blue-500 dark:text-blue-400">
                  ({field.value}m)
                </span>
              </Label>
              <Slider
                step={5}
                min={5}
                max={60}
                value={[field.value]}
                onValueChange={(newValue) => field.onChange(newValue[0])}
              />

              <p className="text-center text-neutral-500 dark:text-neutral-400">
                How often to walk the loaded wallets again
              </p>

              <FieldStateError fieldState={fieldState} />
            </div>
          )}
        />

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

              <p className="text-center text-neutral-500 dark:text-neutral-400">
                Delay between accounts
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

              <p className="text-center text-neutral-500 dark:text-neutral-400">
                Boosts between {100 - field.value}-100% of the master's{" "}
                {config.token} balance.
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
                Boost each account with the amount it last received, capped at
                master's balance.
              </p>
              <LabelToggle {...field} checked={field.value}>
                Reuse each account's last amount
              </LabelToggle>
              <FieldStateError fieldState={fieldState} />
            </div>
          )}
        />

        {/* Include Frozen */}
        <Controller
          control={form.control}
          name="includeFrozen"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Label>Include Frozen</Label>

              <p className="text-center text-neutral-500 dark:text-neutral-400">
                Cultivate frozen accounts too.
              </p>
              <LabelToggle {...field} checked={field.value}>
                Include frozen accounts
              </LabelToggle>
              <FieldStateError fieldState={fieldState} />
            </div>
          )}
        />

        {/* Include Revoked */}
        <Controller
          control={form.control}
          name="includeRevoked"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Label>Include Revoked</Label>

              <p className="text-center text-neutral-500 dark:text-neutral-400">
                Cultivate accounts with revoked buyer protection too.
              </p>
              <LabelToggle {...field} checked={field.value}>
                Include revoked accounts
              </LabelToggle>
              <FieldStateError fieldState={fieldState} />
            </div>
          )}
        />

        {/* Requalify */}
        <Controller
          control={form.control}
          name="requalify"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Label>Requalify after withdrawing</Label>

              <p className="text-center text-neutral-500 dark:text-neutral-400">
                Withdrawing spends buyer standing. A second pass restores it but
                roughly doubles the cycle.
              </p>

              <Select {...field}>
                <Select.Item value="off">Off - leave it alone</Select.Item>
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

        {/* Freeze */}
        <Controller
          control={form.control}
          name="freeze"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Label>Freeze</Label>

              <p className="text-center text-neutral-500 dark:text-neutral-400">
                Freeze each account after cultivating. Later cycles skip it
                unless Include Frozen is on.
              </p>
              <LabelToggle {...field} checked={field.value}>
                Freeze accounts after cultivating
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
                Run a full farming session after connecting. Off is much faster.
              </p>
              <LabelToggle {...field} checked={field.value}>
                Run farmer after connecting
              </LabelToggle>
              <FieldStateError fieldState={fieldState} />
            </div>
          )}
        />

        {status?.running ? (
          <PrimaryButton
            type="button"
            disabled={isPending}
            onClick={handleStop}
          >
            <FaStop className="size-4" />
            {cancelMutation.isPending ? "Stopping..." : "Stop cultivating"}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            type="submit"
            disabled={isPending || !status?.vault.loaded}
          >
            <FaPlay className="size-4" />
            {cultivateMutation.isPending
              ? "Dispatching..."
              : "Start cultivating"}
          </PrimaryButton>
        )}

        <PrimaryButton
          type="button"
          disabled={statusQuery.isFetching}
          onClick={() => statusQuery.refetch()}
        >
          <HiArrowPath className="size-4" />
          Refresh
        </PrimaryButton>
      </form>
    </div>
  );
}
