import AutoAccountDetails from "./AutoAccountDetails";

export default function AutoBoosterDetailsTab({ account }) {
  return (
    <div className="flex flex-col gap-3">
      <AutoAccountDetails account={account} />
    </div>
  );
}
