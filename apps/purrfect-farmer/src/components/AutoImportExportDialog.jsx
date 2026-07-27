import AutoExportForm from "./AutoExportForm";
import AutoImportForm from "./AutoImportForm";
import CenteredDialog from "./CenteredDialog";
import { LuArrowDownUp } from "react-icons/lu";
import Tabs from "./Tabs";

const tabs = {
  rootProps: { defaultValue: "import" },
  list: ["import", "export"],
};

/** Moves wallets between Autos, or in and out of a bundle file */
export default function AutoImportExportDialog({ onImported }) {
  return (
    <CenteredDialog
      icon={LuArrowDownUp}
      title={"Import / Export"}
      description={"Move wallets between Autos"}
    >
      <Tabs tabs={tabs} rootClassName="gap-0">
        <Tabs.Content value="import" className="py-2">
          <AutoImportForm onImported={onImported} />
        </Tabs.Content>
        <Tabs.Content value="export" className="py-2">
          <AutoExportForm />
        </Tabs.Content>
      </Tabs>
    </CenteredDialog>
  );
}
