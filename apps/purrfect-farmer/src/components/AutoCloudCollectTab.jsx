import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import { LuMerge } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import toast from "react-hot-toast";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudCollectionMutation from "@/hooks/useAutoCloudCollectionMutation";

export default function AutoCloudCollectTab() {
  const { config, password, master, accounts } = useAuto();
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useAutoCloudCollectionMutation();

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
        <AutoStickyContainer>
          <div className="flex flex-col gap-2">
            <Alert variant={"success"}>
              Collection dispatched to Cloud. Check your notifications for
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
        <>
          <Alert variant="info">
            Collects in Cloud. Sends TON from master, returns any {config.token}{" "}
            found, then returns leftover TON.
          </Alert>

          <AutoStickyContainer>
            <PrimaryButton
              disabled={mutation.isPending}
              onClick={handleCollect}
            >
              <LuMerge className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Collect"}
            </PrimaryButton>
          </AutoStickyContainer>
        </>
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
