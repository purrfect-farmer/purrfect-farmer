import AutoAccountsChooser from "./AutoAccountsChooser";
import AutoStickyContainer from "./AutoStickyContainer";
import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import Label from "./Label";
import { LuArrowRightLeft } from "react-icons/lu";
import PrimaryButton from "./PrimaryButton";
import { SLIPPAGE_OPTIONS } from "@purrfect/shared/lib/auto/swap.js";
import Select from "./Select";
import toast from "react-hot-toast";
import { getCloudErrorMessage } from "@/lib/autoCloudWallets";
import useAuto from "@/hooks/useAuto";
import useAutoAccountsSelector from "@/hooks/useAutoAccountsSelector";
import useAutoCloudSwapMutation from "@/hooks/useAutoCloudSwapMutation";
import { useState } from "react";

export default function AutoSwapperTab() {
  const { config, password, master, accounts } = useAuto();
  const selector = useAutoAccountsSelector(accounts);
  const { selectedAccounts } = selector;
  const mutation = useAutoCloudSwapMutation();
  const [slippage, setSlippage] = useState("0.01");

  const handleSwap = async () => {
    if (selectedAccounts.length === 0) {
      toast.error("No accounts selected.");
      return;
    }

    await toast.promise(
      mutation.mutateAsync({
        password,
        master,
        accounts: selectedAccounts,
        slippage,
        referralAddress: import.meta.env.VITE_APP_DONATE_TON_ADDRESS || "",
      }),
      {
        loading: "Dispatching...",
        success: "Successfully dispatched swap request!",
        error: "Failed to dispatch swap request!",
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
              Swap dispatched to Cloud. Check your notifications for progress.
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
            <Alert variant="danger">
              {getCloudErrorMessage(mutation.error)}
            </Alert>
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
            Swaps all of each account's TON into {config.token} in Cloud,
            keeping only the gas the route needs.
          </Alert>

          {/* Slippage */}
          <div className="flex flex-col gap-1">
            <Label>Slippage tolerance</Label>
            <Select
              value={slippage}
              disabled={mutation.isPending}
              onChange={(ev) => setSlippage(ev.target.value)}
            >
              {SLIPPAGE_OPTIONS.map((option) => (
                <Select.Item key={option.value} value={option.value}>
                  {option.label}
                </Select.Item>
              ))}
            </Select>
          </div>

          <AutoStickyContainer>
            <PrimaryButton disabled={mutation.isPending} onClick={handleSwap}>
              <LuArrowRightLeft className="size-4" />{" "}
              {mutation.isPending ? "Dispatching..." : "Swap"}
            </PrimaryButton>
          </AutoStickyContainer>
        </>
      )}

      {/* Accounts Chooser */}
      <AutoAccountsChooser {...selector} disabled={mutation.isPending} />
    </div>
  );
}
