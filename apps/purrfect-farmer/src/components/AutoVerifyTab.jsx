import Alert from "./Alert";
import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import { HiArrowPath } from "react-icons/hi2";
import { MdVerifiedUser } from "react-icons/md";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudVerifyMutation from "@/hooks/useAutoCloudVerifyMutation";

export default function AutoVerifyTab() {
  const { config, password, master, accounts } = useAuto();
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useAutoCloudVerifyMutation();

  const handleVerify = async () => {
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
        success: "Successfully dispatched verification!",
        error: "Failed to dispatch verification!",
      },
    );
  };

  return (
    <div className="flex flex-col gap-3 p-2">
      {/* Results summary */}
      {mutation.isSuccess && (
        <AutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant={"success"}>
              Verification dispatched to Cloud. Check your notifications for
              progress.
            </Alert>

            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </AutoStickyContainer>
      )}

      {mutation.isError && (
        <AutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant="danger">{mutation.error.message}</Alert>
            <PrimaryButton type="button" onClick={() => mutation.reset()}>
              <HiArrowPath className="w-4 h-4" />
              Reset
            </PrimaryButton>
          </div>
        </AutoStickyContainer>
      )}

      {/* Button */}
      {!mutation.isSuccess && !mutation.isError && (
        <div className="flex flex-col gap-2">
          <Alert variant="info">
            Pays each selected account's one-time {config.title} verification
            from its own wallet. Fund every wallet with TON first: the fee plus
            a little for gas. Verified accounts are skipped, and a recent
            payment is only re-checked, never sent twice.
          </Alert>

          <AutoStickyContainer>
            <PrimaryButton
              type="button"
              onClick={handleVerify}
              disabled={mutation.isPending}
            >
              <MdVerifiedUser className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Verify"}
            </PrimaryButton>
          </AutoStickyContainer>
        </div>
      )}

      {/* Accounts Chooser */}
      <AutoAccountsChooser
        {...selector}
        disabled={mutation.isPending}
        results={mutation.data?.results}
      />
    </div>
  );
}
