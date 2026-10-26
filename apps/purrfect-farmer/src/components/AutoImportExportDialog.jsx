import { IMPORT_TAB } from "@/constants/autoImportTab";
import AutoExportForm from "./AutoExportForm";
import AutoImportForm from "./AutoImportForm";
import AutoWhiskersImportForm from "./AutoWhiskersImportForm";
import CenteredDialog from "./CenteredDialog";
import { LuArrowDownUp } from "react-icons/lu";
import Tabs from "./Tabs";
import { useMemo } from "react";

/** Moves wallets between Autos or in and out of a bundle file, and builds accounts from a Whiskers backup */
export default function AutoImportExportDialog({
  defaultTab = IMPORT_TAB.IMPORT,
  onImported,
}) {
  /** The tabs, opening on `defaultTab` */
  const tabs = useMemo(
    () => ({
      rootProps: { defaultValue: defaultTab },
      list: Object.values(IMPORT_TAB),
    }),
    [defaultTab],
  );

  return (
    <CenteredDialog
      icon={LuArrowDownUp}
      title={"Import / Export"}
      description={"Move wallets between Autos"}
    >
      <Tabs tabs={tabs} rootClassName="gap-0">
        <Tabs.Content value={IMPORT_TAB.IMPORT} className="py-2">
          <AutoImportForm onImported={onImported} />
        </Tabs.Content>
        <Tabs.Content value={IMPORT_TAB.WHISKERS} className="py-2">
          <AutoWhiskersImportForm onImported={onImported} />
        </Tabs.Content>
        <Tabs.Content value={IMPORT_TAB.EXPORT} className="py-2">
          <AutoExportForm />
        </Tabs.Content>
      </Tabs>
    </CenteredDialog>
  );
}
