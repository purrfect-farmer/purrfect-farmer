import {
  buildCandidates,
  filterCandidates,
  parseWhiskersBackup,
} from "@/lib/whiskersAccounts";
import { useMemo, useState } from "react";

import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoProgress from "./AutoProgress";
import Alert from "./Alert";
import Dropzone from "./Dropzone";
import Label from "./Label";
import LabelToggle from "./LabelToggle";
import { LuDownload } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import Select from "./Select";
import { formatMergeSummary } from "@/lib/autoTransfer";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoWhiskersImportMutation from "@/hooks/useAutoWhiskersImportMutation";

const ALL_TAGS = "";

/** Stable identity so the accounts selector doesn't reset on every render */
const NO_CANDIDATES = [];

/**
 * Builds this drop's accounts from a Purrfect Whiskers backup.
 *
 * Only the Telegram identity of each Whiskers account is read — the session
 * blobs a backup carries are ignored — so an account already here keeps its
 * wallet and takes the Whiskers title, and one that isn't gets a fresh wallet
 * generated for it.
 */
export default function AutoWhiskersImportForm({ onImported }) {
  const { config, accounts, master } = useAuto();
  const { mutation, progress } = useAutoWhiskersImportMutation();

  const [parsed, setParsed] = useState(null);
  const [tag, setTag] = useState(ALL_TAGS);
  const [hideExisting, setHideExisting] = useState(false);

  const candidates = useMemo(
    () =>
      parsed
        ? buildCandidates({
            accounts: parsed.accounts,
            existing: accounts,
            version: master?.version || 5,
          })
        : NO_CANDIDATES,
    [parsed, accounts, master],
  );

  /**
   * Memoised because `useAutoAccountsSelector` resets the selection whenever
   * the array identity changes — a fresh array per render would clear every
   * tick, while re-filtering deliberately reselects everything now visible.
   */
  const visibleCandidates = useMemo(
    () =>
      candidates === NO_CANDIDATES
        ? NO_CANDIDATES
        : filterCandidates(candidates, { tag, hideExisting }),
    [candidates, tag, hideExisting],
  );

  const selector = useAutoAccountsSelector(visibleCandidates);
  const { selectedAccounts } = selector;

  const existingCount = useMemo(
    () => candidates.filter((item) => item.existingId).length,
    [candidates],
  );

  const handleFile = (data) => {
    try {
      setParsed(parseWhiskersBackup(data));
      setTag(ALL_TAGS);
      setHideExisting(false);
      toast.success("Whiskers backup loaded!");
    } catch (error) {
      setParsed(null);
      toast.error(error.message);
    }
  };

  const handleImport = async () => {
    try {
      await toast.promise(
        mutation.mutateAsync({ candidates: selectedAccounts }),
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

  return (
    <div className="flex flex-col gap-2">
      <Alert variant="info">
        Only the Telegram account of each Whiskers account is read — never its
        session data. Accounts already in {config.title} keep their wallet and
        take the Whiskers title; the rest get a brand-new wallet, which starts
        empty and needs funding.
      </Alert>

      <Alert variant="warning">
        A backup of {config.title}'s current wallets downloads first, with the
        phrases in plain text. Keep it somewhere safe — anyone holding it can
        spend from every wallet.
      </Alert>

      <Dropzone title="Whiskers backup" onData={handleFile} />

      {parsed && (
        <Alert variant="info">
          Loaded{" "}
          <strong className="font-bold">
            {parsed.accounts.length} accounts
          </strong>
          {parsed.withoutTelegram
            ? ` · ${parsed.withoutTelegram} skipped (no Telegram data)`
            : ""}
          {existingCount
            ? ` · ${existingCount} already in ${config.title}`
            : ""}
          .
        </Alert>
      )}

      {parsed && (
        <>
          {/* Tag */}
          {parsed.tags.length > 0 && (
            <>
              <Label>Whiskers tag</Label>
              <Select
                value={tag}
                disabled={mutation.isPending}
                onChange={(ev) => setTag(ev.target.value)}
              >
                <Select.Item value={ALL_TAGS}>All tags</Select.Item>
                {parsed.tags.map((item) => (
                  <Select.Item key={item.id} value={item.id}>
                    {item.name}
                  </Select.Item>
                ))}
              </Select>
            </>
          )}

          {/* Hide existing */}
          <LabelToggle
            checked={hideExisting}
            disabled={mutation.isPending}
            onChange={(ev) => setHideExisting(ev.target.checked)}
          >
            Hide accounts already in {config.title}
          </LabelToggle>

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
            disabled={mutation.isPending || !selectedAccounts.length}
          >
            <LuDownload className="size-4" />
            {mutation.isPending ? "Importing..." : "Import"}
          </PrimaryButton>
        </>
      )}
    </div>
  );
}
