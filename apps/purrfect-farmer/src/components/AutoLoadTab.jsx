import { Controller, useForm } from "react-hook-form";

import Alert from "./Alert";
import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import { MdCloudUpload } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import Slider from "./Slider";
import { FaPlay, FaStop } from "react-icons/fa6";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudAssistCancellationMutation from "@/hooks/useAutoCloudAssistCancellationMutation";
import useAutoCloudAssistMutation from "@/hooks/useAutoCloudAssistMutation";
import useAutoCloudAssistStatusQuery from "@/hooks/useAutoCloudAssistStatusQuery";
import useAutoCloudLoadMutation from "@/hooks/useAutoCloudLoadMutation";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    assistInterval: yup.number().required().min(5).label("Assist Interval"),
    delay: yup.number().required().min(0).label("Delay"),
  })
  .required();

export default function AutoLoadTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      assistInterval: 10,
      delay: 5,
    },
  });

  const { config, password, master, accounts } = useAuto();
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;

  const statusQuery = useAutoCloudAssistStatusQuery();
  const loadMutation = useAutoCloudLoadMutation();
  const assistMutation = useAutoCloudAssistMutation();
  const cancelMutation = useAutoCloudAssistCancellationMutation();

  const status = statusQuery.data;
  const isPending =
    loadMutation.isPending ||
    assistMutation.isPending ||
    cancelMutation.isPending;

  /** Everything the server needs to unlock the wallets it was handed */
  const payload = (data) => ({
    ...data,
    password,
    master,
    accounts: selectedAccounts,
  });

  const handleLoad = async (data) => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    await toast.promise(loadMutation.mutateAsync(payload(data)), {
      loading: "Loading...",
      success: "Wallets sent to the server!",
      error: "Failed to send the wallets!",
    });

    statusQuery.refetch();
  };

  const handleAssist = async () => {
    await toast.promise(assistMutation.mutateAsync(payload(form.getValues())), {
      loading: "Dispatching...",
      success: "Assisted withdrawals started!",
      error: "Failed to start assisted withdrawals!",
    });

    statusQuery.refetch();
  };

  const handleStop = async () => {
    await toast.promise(cancelMutation.mutateAsync({}), {
      loading: "Stopping...",
      success: "Assisted withdrawals stopping...",
      error: "Failed to stop assisted withdrawals!",
    });

    statusQuery.refetch();
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      <Alert variant="info">
        Hand this server the wallets it should keep, then let its verified
        accounts withdraw for the rest. Loading alone performs no action - no
        boosting, no collecting, no farming.
      </Alert>

      {/* What the server currently holds */}
      {status ? (
        <AutoStickyContainer>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500 dark:text-neutral-400">
                Loaded wallets
              </span>
              <span className="font-bold">{status.vault.accounts}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500 dark:text-neutral-400">
                Verified accounts
              </span>
              <span className="font-bold">{status.vault.verified.length}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-neutral-500 dark:text-neutral-400">
                Assisting
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
          This server holds no wallets. They are kept in memory only, so load
          them again after every restart.
        </Alert>
      ) : null}

      {status?.vault.loaded && status.vault.verified.length === 0 ? (
        <Alert variant="warning">
          None of the loaded accounts is marked as verified, so there is nobody
          to withdraw on the others' behalf.
        </Alert>
      ) : null}

      <form
        onSubmit={form.handleSubmit(handleLoad)}
        className="flex flex-col gap-2"
      >
        {/* Assist interval */}
        <Controller
          control={form.control}
          name="assistInterval"
          render={({ field, fieldState }) => (
            <div className="flex flex-col gap-1">
              <Label>
                Assist every{" "}
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
                How often to look for accounts that have reached{" "}
                {config.minWithdrawal} {config.token}
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

        <PrimaryButton type="submit" disabled={isPending}>
          <MdCloudUpload className="size-4" />
          {loadMutation.isPending ? "Loading..." : "Load wallets"}
        </PrimaryButton>

        {status?.running ? (
          <PrimaryButton
            type="button"
            disabled={isPending}
            onClick={handleStop}
          >
            <FaStop className="size-4" />
            {cancelMutation.isPending ? "Stopping..." : "Stop assisting"}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            type="button"
            disabled={isPending || !status?.vault.loaded}
            onClick={handleAssist}
          >
            <FaPlay className="size-4" />
            {assistMutation.isPending ? "Dispatching..." : "Start assisting"}
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

      {/* Accounts Chooser */}
      <AutoAccountsChooser {...selector} disabled={isPending} />
    </div>
  );
}
