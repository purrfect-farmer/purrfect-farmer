import { Controller, useForm } from "react-hook-form";

import Alert from "./Alert";
import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import Dropzone from "./Dropzone";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import { LuLifeBuoy } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import Slider from "./Slider";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudRescueMutation from "@/hooks/useAutoCloudRescueMutation";
import { useState } from "react";
import { validateBundle } from "@/lib/autoTransfer";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

/** Stable identity so the requesters selector doesn't reset on every render */
const NO_ACCOUNTS = [];

const schema = yup
  .object({
    delay: yup.number().required().min(0).label("Delay"),
  })
  .required();

/** Adopting a freed wallet only needs its address and version, so phrases never leave the device */
function pickRequester(account) {
  return {
    userId: account.userId,
    title: account.title,
    address: account.address,
    version: account.version,
  };
}

/** This Auto's accounts withdraw for flipped accounts loaded from an export, adopting each freed wallet in turn */
export default function AutoRescueTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      delay: 0,
    },
  });

  const { config, password, master, accounts } = useAuto();
  const [bundle, setBundle] = useState(null);
  const mutation = useAutoCloudRescueMutation();

  const requesterSelector = useAutoAccountsSelector(
    bundle?.accounts || NO_ACCOUNTS,
  );
  const helperSelector = useAutoAccountsSelector(accounts);

  const handleFile = (data) => {
    try {
      const loaded = validateBundle(data);

      if (loaded.auto !== config.id) {
        throw new Error(
          `This export belongs to ${loaded.title}, not ${config.title}.`,
        );
      }

      setBundle(loaded);
      toast.success("Export file loaded!");
    } catch (error) {
      setBundle(null);
      toast.error(error.message);
    }
  };

  const handleRescue = async (data) => {
    if (requesterSelector.selectedAccounts.length === 0) {
      toast.error("No requesters selected.");
      return;
    }

    if (helperSelector.selectedAccounts.length === 0) {
      toast.error("No helpers selected.");
      return;
    }

    await toast.promise(
      mutation.mutateAsync({
        ...data,
        password,
        master,
        accounts: helperSelector.selectedAccounts,
        requesters: requesterSelector.selectedAccounts.map(pickRequester),
      }),
      {
        loading: "Dispatching...",
        success: "Successfully dispatched rescue request!",
        error: "Failed to dispatch rescue request!",
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {mutation.isSuccess && (
        <AutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant="success">
              Rescue dispatched to Cloud. Check your notifications for
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

      {!mutation.isSuccess && !mutation.isError && (
        <form
          onSubmit={form.handleSubmit(handleRescue)}
          className="flex flex-col gap-2"
        >
          <Alert variant="info">
            Each helper connects a requester's own wallet, withdraws its pool,
            then reconnects its own. Drop in the export the Flip tab
            downloaded - requesters must be flipped first.
          </Alert>

          <Alert variant="warning">
            A helper places at most one withdrawal, and rests until the drop
            settles it.
          </Alert>

          <Dropzone title="export file" onData={handleFile} />

          {bundle && (
            <Alert variant="info">
              Loaded <strong className="font-bold">{bundle.title}</strong> -{" "}
              {bundle.accounts.length} accounts.
            </Alert>
          )}

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
                  Delay between requesters
                </p>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          <PrimaryButton
            type="submit"
            disabled={mutation.isPending || !bundle}
          >
            <LuLifeBuoy className="size-4" />{" "}
            {mutation.isPending ? "Dispatching..." : "Rescue"}
          </PrimaryButton>
        </form>
      )}

      {/* Requesters, which may be farmed elsewhere, so this drop's snapshots don't apply */}
      {bundle && (
        <>
          <Label>Requesters</Label>
          <div className="max-h-96 overflow-auto">
            <AutoAccountsChooser
              {...requesterSelector}
              showBalance={false}
              autoFocusSearch={false}
              disabled={mutation.isPending}
            />
          </div>
        </>
      )}

      {/* Helpers */}
      <Label>Helpers</Label>
      <AutoAccountsChooser
        {...helperSelector}
        autoFocusSearch={false}
        disabled={mutation.isPending}
      />
    </div>
  );
}
