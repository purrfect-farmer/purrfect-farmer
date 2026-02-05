import CloudCenteredDialog from "./CloudCenteredDialog";
import PrimaryButton from "@/components/PrimaryButton";
import Tabs from "@/components/Tabs";
import { downloadFile } from "@/utils";
import toast from "react-hot-toast";
import useCloudManagerExportBackupMutation from "@/hooks/useCloudManagerExportBackupMutation";
import useCloudManagerImportBackupMutation from "@/hooks/useCloudManagerImportBackupMutation";
import { useDropzone } from "react-dropzone";
import useMirroredTabs from "@/hooks/useMirroredTabs";

export default function CloudServerBackup() {
  const tabs = useMirroredTabs(
    "cloud-backup-panel",
    ["import", "export"],
    "import",
  );

  const importMutation = useCloudManagerImportBackupMutation();
  const exportMutation = useCloudManagerExportBackupMutation();

  const exportBackup = async () => {
    const result = await toast.promise(exportMutation.mutateAsync(), {
      loading: "Exporting...",
      success: "Exported backup successfully!",
      error: "Failed to export backup",
    });

    downloadFile(result.filename, result.data);
  };

  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    const reader = new FileReader();

    reader.addEventListener("load", (e) => {
      try {
        const backup = JSON.parse(e.target.result);

        toast.promise(importMutation.mutateAsync({ backup }), {
          loading: "Importing...",
          success: "Imported backup successfully!",
          error: "Failed to import backup",
        });
      } catch (err) {
        toast.error("Invalid JSON file!");
      }
    });
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <CloudCenteredDialog
      title={"Backup / Restore"}
      description={"Import or export a backup of the server"}
    >
      <Tabs tabs={tabs}>
        <Tabs.Content value="import">
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
        </Tabs.Content>
        <Tabs.Content value="export" className="flex flex-col">
          <PrimaryButton onClick={exportBackup}>
            {exportMutation.isPending ? "Exporting..." : "Export Backup"}
          </PrimaryButton>
        </Tabs.Content>
      </Tabs>
    </CloudCenteredDialog>
  );
}
