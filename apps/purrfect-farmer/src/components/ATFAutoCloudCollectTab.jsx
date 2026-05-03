import ATFAutoAccountsChooser from "./ATFAutoAccountsChooser";
import ATFAutoStickyContainer from "./ATFAutoStickyContainer";
import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import { LuMerge } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useATFAuto from "@/hooks/useATFAuto";
import useATFAutoAccountsSelector from "@/hooks/useATFAutoAccountsSelector";
import useATFAutoCloudCollectionMutation from "@/hooks/useATFAutoCloudCollectionMutation";

export default function ATFAutoCloudCollectTab() {
  const { password, master, accounts } = useATFAuto();
  const selector = useATFAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useATFAutoCloudCollectionMutation();

  const handleCollect = async () => {
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
        success: "Successfully dispatched collection request!",
        error: "Failed to dispatch collection request!",
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <div className="flex flex-col gap-2">
          <Alert variant={"success"}>
            Collection request was successfully dispatched to Cloud. Kindly
            check your notifications for progress.
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
            Perform collection in Cloud. Checks each account for ATF tokens, if
            found - it sends TON from master, transfers the ATF back to master,
            and returns remaining TON.
          </Alert>

          <ATFAutoStickyContainer>
            <PrimaryButton
              disabled={mutation.isPending}
              onClick={handleCollect}
            >
              <LuMerge className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Collect"}
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
