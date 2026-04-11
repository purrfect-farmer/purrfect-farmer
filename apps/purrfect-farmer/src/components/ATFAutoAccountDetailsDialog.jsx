import ATFAutoAccountDetails from "./ATFAutoAccountDetails";
import CenteredDialog from "./CenteredDialog";

export default function ATFAutoAccountDetailsDialog({ account }) {
  return (
    <CenteredDialog title={account.title} description={"Account details"}>
      <ATFAutoAccountDetails account={account} />
    </CenteredDialog>
  );
}
