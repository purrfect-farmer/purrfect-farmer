import AutoAccountDetails from "./AutoAccountDetails";
import CenteredDialog from "./CenteredDialog";

export default function AutoAccountDetailsDialog({ account }) {
  return (
    <CenteredDialog title={account.title} description={"Account details"}>
      <AutoAccountDetails account={account} />
    </CenteredDialog>
  );
}
