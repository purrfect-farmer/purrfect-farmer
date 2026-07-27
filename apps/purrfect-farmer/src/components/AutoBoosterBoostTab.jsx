import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import Input from "./Input";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import useAuto from "@/hooks/useAuto";
import useAutoSingleBoostMutation from "@/hooks/useAutoSingleBoostMutation";
import { useState } from "react";

export default function AutoBoosterBoostTab({ account }) {
  const { config } = useAuto();
  const mutation = useAutoSingleBoostMutation();
  const [difference, setDifference] = useState(20);

  const handleBoost = () => {
    mutation.mutate({ account, difference });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Sends {config.token} from master wallet to this account based on difference.
      </Alert>

      {mutation.isSuccess && (
        <>
          <Alert variant={mutation.data.status ? "success" : "info"}>
            {mutation.data.status
              ? "Boost completed!"
              : mutation.data.skipped
                ? "Skipped — holding already sufficient."
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
              {difference}% means {100 - difference}-100% of master {config.token} balance
            </p>
          </div>

          <PrimaryButton disabled={mutation.isPending} onClick={handleBoost}>
            {mutation.isPending ? "Boosting..." : "Boost"}
          </PrimaryButton>
        </>
      )}
    </div>
  );
}
