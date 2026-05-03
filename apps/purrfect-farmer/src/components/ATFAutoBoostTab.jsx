import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoStickyContainer from "./ATFAutoStickyContainer";
import Alert from "./Alert";
import { FaFire } from "react-icons/fa6";
import { HiArrowPath } from "react-icons/hi2";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoAccountsSelector from "@/hooks/useATFAutoAccountsSelector";
import useATFAutoCloudBoostMutation from "@/hooks/useATFAutoCloudBoostMutation";

export default function ATFAutoBoostTab() {
  const { password, master, accounts } = useATFAuto();
  const selector = useATFAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useATFAutoCloudBoostMutation();

  const handleBoost = async () => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    await toast.promise(
      mutation.mutateAsync({
        password,
        master,
        accounts: selectedAccounts,
      }),
      {
        loading: "Dispatching...",
        success: "Successfully dispatched boost request!",
        error: "Failed to dispatch boost request!",
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <div className="flex flex-col gap-2">
          <Alert variant={"success"}>
            Boost request was successfully dispatched to Cloud. Kindly check
            your notifications for progress.
          </Alert>

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
            Perform boost in Cloud. ATF will be transferred from the master
            wallet into each selected account. Ensure the master wallet has
            enough TON for operations.
          </Alert>

          <ATFAutoStickyContainer>
            <PrimaryButton disabled={mutation.isPending} onClick={handleBoost}>
              <FaFire className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Boost"}
            </PrimaryButton>
          </ATFAutoStickyContainer>
        </>
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
