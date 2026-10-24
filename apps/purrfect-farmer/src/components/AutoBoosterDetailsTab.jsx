import AutoAccountDetails from "./AutoAccountDetails";
import AutoBoosterWalletPush from "./AutoBoosterWalletPush";

export default function AutoBoosterDetailsTab({ account }) {
  return (
    <div className="flex flex-col gap-3">
      <AutoBoosterWalletPush account={account} />
      <AutoAccountDetails account={account} />
    </div>
  );
}
