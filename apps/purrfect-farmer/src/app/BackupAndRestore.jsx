import { cn, downloadFile } from "@/utils";

import Alert from "@/components/Alert";
import AppIcon from "@/assets/images/icon.png?format=webp&w=192";
import Container from "@/components/Container";
import PrimaryButton from "@/components/PrimaryButton";
import Tabs from "@/components/Tabs";
import { formatDate } from "date-fns";
import toast from "react-hot-toast";
import useBackupAndRestore from "@/hooks/useBackupAndRestore";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import useMirroredTabs from "@/hooks/useMirroredTabs";

const TabContent = ({ title, children, ...props }) => (
  <Tabs.Content {...props} className={cn("flex flex-col gap-4")}>
    <div className="flex flex-col gap-2 justify-center items-center">
      <img src={AppIcon} className="size-24" />
      <h1 className="font-turret-road text-center text-3xl text-orange-500">
        {title}
      </h1>
    </div>

    {children}
  </Tabs.Content>
);

export default function BackupAndRestore() {
  const tabs = useMirroredTabs("backup-and-restore", ["backup", "restore"]);
  const [getBackupData, restoreBackupData] = useBackupAndRestore();

  const downloadBackupFile = useCallback((data) => {
    downloadFile(
      `${__APP_PACKAGE_NAME__}-backup-${formatDate(
        new Date(),
        "yyyyMMdd-HHmmss",
      )}.json`,
      data,
    );
  }, []);

  const backupAllData = useCallback(
    () =>
      getBackupData().then((data) => {
        downloadBackupFile(data);
        toast.success("Backup Downloaded!");
      }),
    [getBackupData],
  );

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      const reader = new FileReader();

      reader.addEventListener("load", (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const { data } = json;

          restoreBackupData(data).then(() => toast.success("Backup restored!"));
        } catch (err) {
          toast.error("Invalid JSON file!");
        }
      });
      reader.readAsText(file);
    },
    [restoreBackupData],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <Tabs tabs={tabs} rootClassName="grow gap-0 overflow-auto">
      <div className="flex flex-col grow overflow-auto">
        <Container className="p-4 my-auto">
          <TabContent value="backup" title={"Backup Data"}>
            <Alert variant={"warning"} className="text-center">
              You are about to backup all data of the extension. This includes
              accounts and Telegram Web data.
            </Alert>

            <PrimaryButton onClick={() => backupAllData()}>
              Backup Now
            </PrimaryButton>
          </TabContent>

          <TabContent value="restore" title={"Restore Data"}>
            <Alert variant={"warning"} className="text-center">
              You are about to restore all data of the extension. This includes
              accounts and Telegram Web data.
            </Alert>

            <div
              {...getRootProps()}
              className="border border-dashed border-blue-500 px-4 py-10 text-center rounded-xl"
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Drop the backup file here ...</p>
              ) : (
                <p>
                  Drag 'n' drop the backup file here, or click to select backup
                  file
                </p>
              )}
            </div>
          </TabContent>
        </Container>
      </div>
    </Tabs>
  );
}
