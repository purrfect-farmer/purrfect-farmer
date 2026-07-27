import AutoImportForm from "./AutoImportForm";
import CenteredDialog from "./CenteredDialog";
import { LuArrowDownUp } from "react-icons/lu";

/**
 * Import on its own, for a drop that has no master yet.
 *
 * There is nothing to export at that point, so this skips the tabs that
 * `AutoImportExportDialog` shows.
 */
export default function AutoImportDialog() {
  return (
    <CenteredDialog
      icon={LuArrowDownUp}
      title={"Import Wallets"}
      description={"Set this Auto up from another Auto's wallets"}
    >
      <AutoImportForm />
    </CenteredDialog>
  );
}
