import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoStickyContainer from "./ATFAutoStickyContainer";
import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import { MdCheckCircle } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoAccountsSelector from "@/hooks/useATFAutoAccountsSelector";
import useATFAutoCloudStatusMutation from "@/hooks/useATFAutoCloudStatusMutation";

export default function ATFAutoStatusTab() {
  const { password, master, accounts } = useATFAuto();
  const selector = useATFAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useATFAutoCloudStatusMutation();

  const handleStatus = async () => {
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
        success: "Successfully dispatched status request!",
        error: "Failed to dispatch status request!",
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
              Status request was successfully dispatched to Cloud. Kindly check
              your notifications for progress.
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
            Request for account status in Cloud. Details include mined balance,
            risks and wallet information.
          </Alert>

          <ATFAutoStickyContainer>
            <PrimaryButton disabled={mutation.isPending} onClick={handleStatus}>
              <MdCheckCircle className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Status"}
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
