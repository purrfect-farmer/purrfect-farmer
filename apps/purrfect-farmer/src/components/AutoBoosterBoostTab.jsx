import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import Input from "./Input";
import Label from "./Label";
import LabelToggle from "./LabelToggle";
import PrimaryButton from "./PrimaryButton";
import useAppContext from "@/hooks/useAppContext";
import useAuto from "@/hooks/useAuto";
import useAutoCloudSingleBoostMutation from "@/hooks/useAutoCloudSingleBoostMutation";
import useAutoSingleBoostMutation from "@/hooks/useAutoSingleBoostMutation";
import useCloudQueryOptions from "@/hooks/useCloudQueryOptions";
import { useState } from "react";

export default function AutoBoosterBoostTab({ account }) {
  const { config } = useAuto();
  const { settings, dispatchAndConfigureSettings } = useAppContext();
  const { enabled: cloudEnabled } = useCloudQueryOptions();

  const localMutation = useAutoSingleBoostMutation();
  const cloudMutation = useAutoCloudSingleBoostMutation();

  const useCloud = cloudEnabled && settings.useCloudForBooster;
  const mutation = useCloud ? cloudMutation : localMutation;

  const [difference, setDifference] = useState(5);
  const [amount, setAmount] = useState("");
  const [reuseLastAmount, setReuseLastAmount] = useState(false);

  /** An amount that is not a positive number would only fail inside the booster */
  const amountIsValid = !amount || Number(amount) > 0;

  const handleBoost = () => {
    mutation.mutate({ account, difference, amount, reuseLastAmount });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Sends {config.token} from master wallet to this account based on
        difference.
      </Alert>

      {mutation.isSuccess && (
        <>
          <Alert variant={mutation.data.status ? "success" : "info"}>
            {mutation.data.status
              ? "Boost completed!"
              : mutation.data.skipped
                ? `Skipped - master has no ${config.token} to send.`
                : `Failed: ${mutation.data.error?.message || "Unknown error"}`}
          </Alert>
          <PrimaryButton type="button" onClick={() => mutation.reset()}>
            <HiArrowPath className="w-4 h-4" />
            Reset
          </PrimaryButton>
        </>
      )}

      {mutation.isError && (
        <>
          <Alert variant="danger">{mutation.error.message}</Alert>
          <PrimaryButton type="button" onClick={() => mutation.reset()}>
            <HiArrowPath className="w-4 h-4" />
            Reset
          </PrimaryButton>
        </>
      )}

      {!mutation.isSuccess && !mutation.isError && (
        <>
          <div className="flex flex-col gap-1">
            <Label>Difference (%)</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={difference}
              onChange={(e) => setDifference(Number(e.target.value))}
              disabled={mutation.isPending}
            />
            <p className="text-xs text-neutral-400 px-2">
              {difference}% means {100 - difference}-100% of{" "}
              {amount
                ? `${amount} ${config.token}`
                : `master ${config.token} balance`}
            </p>
          </div>

          {/* Amount to boost against, instead of the master's whole balance */}
          <div className="flex flex-col gap-1">
            <Label>Amount</Label>
            <Input
              value={amount}
              inputMode="decimal"
              autoComplete="off"
              onChange={(e) => setAmount(e.target.value)}
              disabled={mutation.isPending}
              placeholder="Leave empty to use the full balance"
            />
            <p className="text-xs text-neutral-400 px-2">
              Boost against this much {config.token} instead of everything
              master holds.
            </p>
          </div>

          {/* Only the Cloud knows what this account was last boosted with */}
          {useCloud && (
            <div className="flex flex-col gap-1">
              <LabelToggle
                disabled={mutation.isPending}
                checked={reuseLastAmount}
                onChange={(ev) => setReuseLastAmount(ev.target.checked)}
              >
                Reuse last amount
              </LabelToggle>
              <p className="text-xs text-neutral-400 px-2">
                Sends the amount this account last received, capped at what
                master holds.
              </p>
            </div>
          )}

          {/* Runs the same transfer in the Cloud, which is far quicker than the browser */}
          {cloudEnabled && (
            <LabelToggle
              disabled={mutation.isPending}
              checked={Boolean(settings.useCloudForBooster)}
              onChange={(ev) =>
                dispatchAndConfigureSettings(
                  "useCloudForBooster",
                  ev.target.checked,
                )
              }
            >
              Use Cloud
            </LabelToggle>
          )}

          <PrimaryButton
            disabled={mutation.isPending || !amountIsValid}
            onClick={handleBoost}
          >
            {mutation.isPending ? "Boosting..." : "Boost"}
          </PrimaryButton>
        </>
      )}
    </div>
  );
}
