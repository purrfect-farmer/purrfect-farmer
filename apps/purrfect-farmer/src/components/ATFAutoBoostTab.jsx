import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoProgress from "./ATFAutoProgress";
import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import Input from "./Input";
import Label from "./Label";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoAccountsSelector from "@/hooks/useATFAutoAccountsSelector";
import useATFAutoBoostMutation from "@/hooks/useATFAutoBoostMutation";
import { useState } from "react";

export default function ATFAutoBoostTab() {
  const { accounts } = useATFAuto();
  const selector = useATFAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const { mutation, target, progress } = useATFAutoBoostMutation();
  const [difference, setDifference] = useState(10);

  const handleBoost = async () => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    await mutation.mutateAsync({
      accounts: selectedAccounts,
      difference,
    });
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <div className="flex flex-col text-center gap-1">
          <p className="text-green-500 font-bold">Boost completed!</p>
          <p className="text-green-500">
            Success: {mutation.data.results.filter((r) => r.status).length} /{" "}
            {mutation.data.results.length}
          </p>
          <p className="text-orange-500">
            Skipped: {mutation.data.results.filter((r) => r.skipped).length}
          </p>
          <PrimaryButton type="button" onClick={() => mutation.reset()}>
            <HiArrowPath className="w-4 h-4" />
            Reset
          </PrimaryButton>
        </div>
      )}

      {mutation.isError && (
        <div className="flex flex-col gap-2">
          <Alert variant="danger">{mutation.error.message}</Alert>
          <PrimaryButton type="button" onClick={() => mutation.reset()}>
            <HiArrowPath className="w-4 h-4" />
            Reset
          </PrimaryButton>
        </div>
      )}

      {/* Config + Button */}
      {!mutation.isSuccess && !mutation.isError && (
        <>
          <Alert variant="info">
            Boost distributes ATF from master to each sub account, processes
            them, then returns funds back to master.
          </Alert>

          {/* Difference */}
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
            {mutation.isPending ? "Boosting..." : "Start Boost"}
          </PrimaryButton>
        </>
      )}

      {/* Progress */}
      {mutation.isPending && (
        <ATFAutoProgress max={target} current={progress} />
      )}

      {/* Accounts Chooser */}
      <ATFAutoAccountsChooser
        {...selector}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </div>
  );
}
