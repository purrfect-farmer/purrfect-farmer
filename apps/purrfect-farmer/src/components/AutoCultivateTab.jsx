import { Controller, useForm } from "react-hook-form";

import Alert from "./Alert";
import AutoStickyContainer from "./AutoStickyContainer";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import LabelToggle from "./LabelToggle";
import PrimaryButton from "./PrimaryButton";
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
        Boost each wallet this server holds, wait for the drop to settle the
        boost, then withdraw the account itself. Verified accounts are left out,
        since they are reserved for assisting.
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
          This server holds no wallets. Load them from the Load tab first, and
          again after every restart.
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

              <p className="text-center text-neutral-500 dark:text-neutral-400">
                This is the difference in the amount to boost based on the
                available {config.token} in the master wallet. E.g a difference
                of {field.value}% would boost between {100 - field.value}-100%
              </p>

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
                Enabling this will freeze each account once it has been
                cultivated, so it stops farming in between cycles. The next
                cycle still picks it up, boosts it and withdraws it.
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
