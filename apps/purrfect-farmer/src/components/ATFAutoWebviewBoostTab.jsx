import { useState } from "react";

import Alert from "./Alert";
import Input from "./Input";
import PrimaryButton from "./PrimaryButton";
import useATFAutoSingleBoostMutation from "@/hooks/useATFAutoSingleBoostMutation";

export default function ATFAutoWebviewBoostTab({ account }) {
  const mutation = useATFAutoSingleBoostMutation();
  const [difference, setDifference] = useState(10);

  const handleBoost = () => {
    mutation.mutate({ account, difference });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Sends ATF jettons from master wallet to this account, logs in, connects
        wallet via proof, then returns funds back to master.
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
          <PrimaryButton onClick={() => mutation.reset()}>
            Reset
          </PrimaryButton>
        </>
      )}

      {mutation.isError && (
        <>
          <Alert variant="danger">{mutation.error.message}</Alert>
          <PrimaryButton onClick={() => mutation.reset()}>
            Reset
          </PrimaryButton>
        </>
      )}

      {!mutation.isSuccess && !mutation.isError && (
        <>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
              Difference (%)
            </label>
            <Input
              type="number"
              min={1}
              max={100}
              value={difference}
              onChange={(e) => setDifference(Number(e.target.value))}
              disabled={mutation.isPending}
            />
            <p className="text-xs text-neutral-400">
              {difference}% means {100 - difference}-100% of master balance
            </p>
          </div>

          <PrimaryButton
            disabled={mutation.isPending}
            onClick={handleBoost}
          >
            {mutation.isPending ? "Boosting..." : "Boost"}
          </PrimaryButton>
        </>
      )}
    </div>
  );
}
