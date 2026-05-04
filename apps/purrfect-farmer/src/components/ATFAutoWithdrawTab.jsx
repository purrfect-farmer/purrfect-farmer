import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoStickyContainer from "./ATFAutoStickyContainer";
import Alert from "./Alert";
import { FaDollarSign } from "react-icons/fa6";
import { HiArrowPath } from "react-icons/hi2";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoAccountsSelector from "@/hooks/useATFAutoAccountsSelector";
import useATFAutoCloudWithdrawalMutation from "@/hooks/useATFAutoCloudWithdrawalMutation";

export default function ATFAutoWithdrawTab() {
  const { password, master, accounts } = useATFAuto();
  const selector = useATFAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useATFAutoCloudWithdrawalMutation();

  const handleWithdraw = async () => {
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
        success: "Successfully dispatched withdrawal request!",
        error: "Failed to dispatch withdrawal request!",
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <ATFAutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant={"success"}>
              Withdrawal request was successfully dispatched to Cloud. Kindly
              check your notifications for progress.
            </Alert>

            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </ATFAutoStickyContainer>
      )}

      {mutation.isError && (
        <ATFAutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant="danger">{mutation.error.message}</Alert>
            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </ATFAutoStickyContainer>
      )}

      {/* Button */}
      {!mutation.isSuccess && !mutation.isError && (
        <>
          <Alert variant="info">
            Perform withdrawal in Cloud. Accounts that have mined up to the
            minimum account will be processed.
          </Alert>

          <ATFAutoStickyContainer>
            <PrimaryButton
              disabled={mutation.isPending}
              onClick={handleWithdraw}
            >
              <FaDollarSign className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Withdraw"}
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
