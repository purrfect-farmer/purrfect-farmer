import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import Input from "./Input";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import useATFAutoSingleBoostMutation from "@/hooks/useATFAutoSingleBoostMutation";
import { useState } from "react";

export default function ATFAutoBoosterBoostTab({ account }) {
  const mutation = useATFAutoSingleBoostMutation();
  const [difference, setDifference] = useState(10);

  const handleBoost = () => {
    mutation.mutate({ account, difference });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Sends ATF from master wallet to this account based on difference.
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
              {difference}% means {100 - difference}-100% of master ATF balance
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
