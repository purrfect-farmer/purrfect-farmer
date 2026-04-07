import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoProgress from "./ATFAutoProgress";
import Alert from "./Alert";
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
    <div className="flex flex-col gap-3 px-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <div className="flex flex-col text-center text-sm gap-2">
          <p className="text-green-500 font-bold">Collection completed!</p>
          <p className="text-neutral-500">
            Collected: {mutation.data.results.filter((r) => r.status).length} /{" "}
            {mutation.data.results.length}
          </p>
          <p className="text-neutral-500">
            Skipped (no balance):{" "}
            {mutation.data.results.filter((r) => r.skipped).length}
          </p>
          <PrimaryButton onClick={() => mutation.reset()}>Reset</PrimaryButton>
        </div>
      )}

      {mutation.isError && (
        <div className="flex flex-col gap-2">
          <Alert variant="danger">{mutation.error.message}</Alert>
          <PrimaryButton onClick={() => mutation.reset()}>Reset</PrimaryButton>
        </div>
      )}

      {/* Button */}
      {!mutation.isSuccess && !mutation.isError && (
        <>
          <Alert variant="info">
            Collect checks each sub account for jetton balance. If found, it
            sends gas TON from master, transfers the jetton back to master, and
            returns remaining TON.
          </Alert>

          <PrimaryButton disabled={mutation.isPending} onClick={handleCollect}>
            {mutation.isPending ? "Collecting..." : "Start Collection"}
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
