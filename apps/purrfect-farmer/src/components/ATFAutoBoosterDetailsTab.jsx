import ATFAutoAccountDetails from "./ATFAutoAccountDetails";

export default function ATFAutoBoosterDetailsTab({ account }) {
  return (
    <div className="flex flex-col gap-3">
      <ATFAutoAccountDetails account={account} />
    </div>
  );
}
