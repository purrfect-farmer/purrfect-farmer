import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoProgress from "./ATFAutoProgress";
import ATFAutoStickyContainer from "./ATFAutoStickyContainer";
import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import { LuMerge } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoAccountsSelector from "@/hooks/useATFAutoAccountsSelector";
import useATFAutoCollectMutation from "@/hooks/useATFAutoCollectMutation";

export default function ATFAutoCollectTab() {
  const { accounts } = useATFAuto();
  const selector = useATFAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const { mutation, target, progress } = useATFAutoCollectMutation();

  const handleCollect = async () => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    await mutation.mutateAsync({
      accounts: selectedAccounts,
    });
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <div className="flex flex-col text-center gap-1">
          <p className="text-green-500 font-bold">Collection completed!</p>
          <p className="text-green-500">
            Collected: {mutation.data.results.filter((r) => r.status).length} /{" "}
            {mutation.data.results.length}
          </p>
          <p className="text-orange-500">
            Skipped (no balance):{" "}
            {mutation.data.results.filter((r) => r.skipped).length}
          </p>
          <p className="text-blue-500">
            Total collected: {mutation.data.totalCollected} ATF
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

      {/* Button */}
      {!mutation.isSuccess && !mutation.isError && (
        <>
          <Alert variant="info">
            Collect checks each account for ATF balance. If found, it sends TON
            from master, transfers the ATF back to master, and returns remaining
            TON.
          </Alert>

          <ATFAutoStickyContainer>
            <PrimaryButton
              disabled={mutation.isPending}
              onClick={handleCollect}
            >
              <LuMerge className="size-4" />{" "}
              {mutation.isPending ? "Collecting..." : "Start Collection"}
            </PrimaryButton>
          </ATFAutoStickyContainer>
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
