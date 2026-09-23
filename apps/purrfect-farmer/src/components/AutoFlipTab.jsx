import { Controller, useForm } from "react-hook-form";

import Alert from "./Alert";
import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import FieldStateError from "./FieldStateError";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import LabelToggle from "./LabelToggle";
import { LuArrowLeftRight } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import Slider from "./Slider";
import { createFlippedBundle } from "@/lib/autoTransfer";
import { downloadFile } from "@/utils";
import { formatDate } from "date-fns";
import { getWalletMismatch } from "@/lib/autoSnapshot";
import { useMemo } from "react";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudFlipMutation from "@/hooks/useAutoCloudFlipMutation";
import useAutoCloudSnapshotsQuery from "@/hooks/useAutoCloudSnapshotsQuery";
import useAutoMaster from "@/hooks/useAutoMaster";
import { yup } from "@/lib/yup";
import { yupResolver } from "@hookform/resolvers/yup";

const schema = yup
  .object({
    delay: yup.number().required().min(0).label("Delay"),
    flipDirection: yup
      .string()
      .required()
      .oneOf(["flip", "restore"])
      .label("Direction"),
    downloadExport: yup.boolean().required().label("Download Export"),
  })
  .required();

/** Moves accounts in Cloud onto their phrase's other wallet version, freeing their own wallet for a rescue */
export default function AutoFlipTab() {
  const form = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      delay: 0,
      flipDirection: "flip",
      downloadExport: true,
    },
  });

  const { config, password, master, accounts } = useAuto();
  const flipDirection = form.watch("flipDirection");
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useAutoCloudFlipMutation();
  const { decryptPhrase } = useAutoMaster();
  const { data: snapshots } = useAutoCloudSnapshotsQuery();

  /** Accounts the drop has on another wallet, read from Cloud so a forgotten flip still shows */
  const flipped = useMemo(
    () =>
      accounts.filter((account) =>
        getWalletMismatch(
          snapshots?.get(String(account.userId))?.snapshot,
          account,
        ),
      ),
    [accounts, snapshots],
  );

  const handleSelectFlipped = () => {
    selector.selectAccounts(flipped);
    form.setValue("flipDirection", "restore");
  };

  const handleFlip = async ({ downloadExport, ...data }) => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    /** Written before dispatching, so the list survives a failed or interrupted flip */
    if (data.flipDirection === "flip" && downloadExport) {
      /** Plain phrases, so any other Auto can load the file whatever its password */
      const flippedAccounts = await Promise.all(
        selectedAccounts.map(async (account) => ({
          ...account,
          phrase: await decryptPhrase(account.encryptedPhrase),
        })),
      );

      downloadFile(
        `${config.id}-flipped-${formatDate(new Date(), "yyyyMMdd-HHmmss")}.json`,
        createFlippedBundle({ config, accounts: flippedAccounts }),
      );
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
        success: "Successfully dispatched flip request!",
        error: "Failed to dispatch flip request!",
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {mutation.isSuccess && (
        <AutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant="success">
              Flip dispatched to Cloud. Check your notifications for progress.
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
          onSubmit={form.handleSubmit(handleFlip)}
          className="flex flex-col gap-2"
        >
          {flipped.length ? (
            <div className="flex flex-col gap-2">
              <Alert variant="warning">
                {flipped.length} account(s) are not on their own wallet.
              </Alert>
              <PrimaryButton type="button" onClick={handleSelectFlipped}>
                <HiArrowPath className="size-4" />
                Select for restore
              </PrimaryButton>
            </div>
          ) : null}

          <Alert variant="info">
            Connects each account in Cloud to the other version of its own
            phrase (V4R2 / W5), freeing its wallet so another account can
            rescue it. Nothing stored here changes. An export of the flipped
            accounts downloads first - drop it in the Rescue tab of any Auto.
          </Alert>

          {/* Direction */}
          <Controller
            control={form.control}
            name="flipDirection"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1">
                <Label>Direction</Label>

                <Select {...field}>
                  <Select.Item value="flip">
                    Flip - connect the other version
                  </Select.Item>
                  <Select.Item value="restore">
                    Restore - connect its own wallet again
                  </Select.Item>
                </Select>

                <FieldStateError fieldState={fieldState} />
              </div>
            )}
          />

          {/* Export for the Rescue tab, which a restore has no use for */}
          {flipDirection === "flip" ? (
            <Controller
              control={form.control}
              name="downloadExport"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1">
                  <Label>Export</Label>

                  <p className="text-center text-neutral-500 dark:text-neutral-400">
                    Saves the selected accounts for the Rescue tab before
                    flipping.
                  </p>

                  {field.value ? (
                    <Alert variant="warning">
                      The file holds the wallet phrases in plain text. Anyone
                      holding it can spend from these wallets.
                    </Alert>
                  ) : null}
                  <LabelToggle {...field} checked={field.value}>
                    Download an export of the flipped accounts
                  </LabelToggle>
                  <FieldStateError fieldState={fieldState} />
                </div>
              )}
            />
          ) : null}

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

          <PrimaryButton type="submit" disabled={mutation.isPending}>
            <LuArrowLeftRight className="size-4" />{" "}
            {mutation.isPending ? "Dispatching..." : "Flip"}
          </PrimaryButton>
        </form>
      )}

      <AutoAccountsChooser {...selector} disabled={mutation.isPending} />
    </div>
  );
}
