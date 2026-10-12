import AutoAccountDetails from "./AutoAccountDetails";
import AutoAccountSwitcher from "./AutoAccountSwitcher";
import CenteredDialog from "./CenteredDialog";

export default function AutoAccountDetailsDialog({ account }) {
  return (
    <CenteredDialog title={account.title} description={"Account details"}>
      <AutoAccountSwitcher account={account} />
      <AutoAccountDetails account={account} />
    </CenteredDialog>
  );
}
