import {
  MERGE_STRATEGIES,
  MERGE_STRATEGY_LABELS,
  createBundle,
  formatMergeSummary,
  validateBundle,
} from "@/lib/autoTransfer";
import { useMemo, useState } from "react";

import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoProgress from "./AutoProgress";
import Alert from "./Alert";
import Dropzone from "./Dropzone";
import Label from "./Label";
import LabelToggle from "./LabelToggle";
import { LuDownload } from "react-icons/lu";
import PasswordInput from "./PasswordInput";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoImportMutation from "@/hooks/useAutoImportMutation";
import useAutoSources from "@/hooks/useAutoSources";

const FILE_SOURCE = "file";

/** Stable identity so the accounts selector doesn't reset on every render */
const NO_ACCOUNTS = [];

/**
 * Pulls a master and accounts into this drop, either from another Auto or from
 * an exported bundle file.
 *
 * Rendered both inside `AutoImportExportDialog` and on `AutoMasterSetup`, where
 * the drop has no master yet and the import is what sets it up.
 */
export default function AutoImportForm({ onImported }) {
  const { config, master } = useAuto();
  const sources = useAutoSources();
  const { mutation, progress } = useAutoImportMutation();

  /** With no master of its own, the drop is being set up by this import */
  const bootstrap = !master;

  const [sourceId, setSourceId] = useState(
    () => sources[0]?.config.id || FILE_SOURCE,
  );
  const [fileBundle, setFileBundle] = useState(null);
  const [sourcePassword, setSourcePassword] = useState("");
  const [importMaster, setImportMaster] = useState(true);
  const [strategy, setStrategy] = useState("skip");

  const bundle = useMemo(() => {
    if (sourceId === FILE_SOURCE) {
      return fileBundle;
    }

    const source = sources.find((item) => item.config.id === sourceId);

    return source
      ? createBundle({
          config: source.config,
          master: source.master,
          accounts: source.accounts,
        })
      : null;
  }, [sourceId, fileBundle, sources]);

  const selector = useAutoAccountsSelector(bundle?.accounts || NO_ACCOUNTS);
  const { selectedAccounts } = selector;

  /** Bootstrapping needs the master; without one in the bundle it can't run */
  const canImportMaster = Boolean(bundle?.master);
  const withMaster = canImportMaster && (bootstrap || importMaster);
  const blocked = bootstrap && bundle && !canImportMaster;

  const handleImport = async () => {
    try {
      await toast.promise(
        mutation.mutateAsync({
          bundle,
          sourcePassword,
          accounts: selectedAccounts,
          importMaster: withMaster,
          strategy,
        }),
        {
          loading: "Importing...",
          success: (result) => `Imported! ${formatMergeSummary(result)}`,
          error: (error) => error.message,
        },
      );

      onImported?.();
    } catch {
      /** Surfaced by the toast above */
    }
  };

  const handleFile = (data) => {
    try {
      setFileBundle(validateBundle(data));
      toast.success("Export file loaded!");
    } catch (error) {
      setFileBundle(null);
      toast.error(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Alert variant="danger">
        Imported wallets are the <strong className="font-bold">same</strong>{" "}
        on-chain wallets as the source Auto's. Never run boost, collect or
        withdraw on both Autos at the same time — two operations sending from one
        wallet will clash and drop transactions.
      </Alert>

      {/* Source */}
      <Label>Import from</Label>
      <Select
        value={sourceId}
        disabled={mutation.isPending}
        onChange={(ev) => setSourceId(ev.target.value)}
      >
        {sources.map((source) => (
          <Select.Item key={source.config.id} value={source.config.id}>
            {source.config.title} ({source.accounts.length} accounts)
          </Select.Item>
        ))}
        <Select.Item value={FILE_SOURCE}>Export file</Select.Item>
      </Select>

      {sourceId === FILE_SOURCE && (
        <Dropzone title="export file" onData={handleFile} />
      )}

      {sourceId === FILE_SOURCE && fileBundle && (
        <Alert variant="info">
          Loaded <strong className="font-bold">{fileBundle.title}</strong> —{" "}
          {fileBundle.accounts.length} accounts
          {fileBundle.master ? " and a master wallet" : ""}.
        </Alert>
      )}

      {blocked && (
        <Alert variant="danger">
          This export has no master wallet, so it can't set up {config.title}.
          Either export again with the master included, or set up a master
          manually first.
        </Alert>
      )}

      {bundle && !blocked && (
        <>
          {/* Source password */}
          <Label>Password of the imported wallets</Label>
          <PasswordInput
            value={sourcePassword}
            disabled={mutation.isPending}
            autoComplete="off"
            placeholder="Source password"
            onChange={(ev) => setSourcePassword(ev.target.value)}
          />

          {/* Master */}
          {bootstrap ? (
            <Alert variant="info">
              The master wallet comes across with its password, so{" "}
              {config.title} will use the same password as{" "}
              <strong className="font-bold">{bundle.title}</strong>.
            </Alert>
          ) : (
            <>
              <LabelToggle
                checked={importMaster}
                disabled={!canImportMaster || mutation.isPending}
                onChange={(ev) => setImportMaster(ev.target.checked)}
              >
                Import master wallet
              </LabelToggle>

              {withMaster && (
                <Alert variant="danger">
                  This replaces {config.title}'s master wallet. Withdraw and
                  collect everything from the current master first — you keep
                  its phrase only if you have it saved elsewhere.
                </Alert>
              )}
            </>
          )}

          {/* Merge strategy */}
          {!bootstrap && (
            <>
              <Label>Accounts already in {config.title}</Label>
              <Select
                value={strategy}
                disabled={mutation.isPending}
                onChange={(ev) => setStrategy(ev.target.value)}
              >
                {MERGE_STRATEGIES.map((item) => (
                  <Select.Item key={item} value={item}>
                    {MERGE_STRATEGY_LABELS[item]}
                  </Select.Item>
                ))}
              </Select>

              <p className="text-neutral-500 dark:text-neutral-400">
                Accounts are matched by Telegram user ID, then by address. Use{" "}
                <strong className="font-bold">overwrite</strong> to re-sync after
                rotating wallets in the source Auto.
              </p>
            </>
          )}

          {/* Accounts */}
          <div className="max-h-72 overflow-auto">
            <AutoAccountsChooser
              {...selector}
              showBalance={false}
              autoFocusSearch={false}
              disabled={mutation.isPending}
            />
          </div>

          {/* Progress */}
          {mutation.isPending && progress.target > 0 && (
            <AutoProgress max={progress.target} current={progress.progress} />
          )}

          <PrimaryButton
            type="button"
            onClick={handleImport}
            disabled={
              mutation.isPending ||
              !sourcePassword ||
              (!selectedAccounts.length && !withMaster)
            }
          >
            <LuDownload className="size-4" />
            {mutation.isPending ? "Importing..." : "Import"}
          </PrimaryButton>
        </>
      )}
    </div>
  );
}
