import Alert from "@/components/Alert";
import CloudCenteredDialog from "./CloudCenteredDialog";
import Input from "@/components/Input";
import PrimaryButton from "@/components/PrimaryButton";
import Textarea from "@/components/Textarea";
import toast from "react-hot-toast";
import useCloudManagerImportWhiskersMutation from "@/hooks/useCloudManagerImportWhiskersMutation";
import { useDropzone } from "react-dropzone";
import { useState } from "react";

export default function CloudWhiskersImport() {
  const importMutation = useCloudManagerImportWhiskersMutation();
  const isPending = importMutation.isPending;

  const [backup, setBackup] = useState(null);
  const [fileName, setFileName] = useState("");
  const [passwords, setPasswords] = useState("");
  const [subscriptionDate, setSubscriptionDate] = useState("");

  /** Read and parse the dropped backup file */
  const onDrop = (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        setBackup(parsed);
        setFileName(file.name);
      } catch {
        setBackup(null);
        setFileName("");
        toast.error("Invalid JSON file!");
      }
    });
    reader.readAsText(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/json": [".json"] },
    maxFiles: 1,
    multiple: false,
  });

  /** Submit the import */
  const handleImport = () => {
    if (!backup) {
      toast.error("Please select a whiskers backup file!");
      return;
    }

    toast.promise(
      importMutation.mutateAsync({
        backup,
        passwords,
        subscriptionDate,
      }),
      {
        loading: "Starting import...",
        success: (data) =>
          `Import started for ${data.total} account(s). The admin will be notified on completion.`,
        error: "Failed to start import",
      },
    );
  };

  return (
    <CloudCenteredDialog
      title={"Import Whiskers Backup"}
      description={"Onboard accounts from a purrfect-whiskers backup"}
    >
      <div className="flex flex-col gap-2">
        <Alert variant={"info"}>
          A new cloud session is created for each account. Provide any 2FA
          passwords used (space/comma separated), the server tries each one.
          Runs in the background; the admin is messaged when done.
        </Alert>

        {/* Backup file */}
        <div
          {...getRootProps()}
          className="border border-dashed border-blue-500 px-4 py-8 text-center rounded-xl cursor-pointer"
        >
          <input {...getInputProps()} />
          {fileName ? (
            <p className="font-bold break-all">{fileName}</p>
          ) : isDragActive ? (
            <p>Drop the backup file here ...</p>
          ) : (
            <p>Drag 'n' drop the whiskers backup, or click to select</p>
          )}
        </div>

        {/* 2FA passwords */}
        <Textarea
          autoComplete="off"
          placeholder="2FA passwords (space/comma separated)"
          value={passwords}
          disabled={isPending}
          onChange={(e) => setPasswords(e.target.value)}
        />

        {/* Subscription date */}
        <Input
          type="date"
          autoComplete="off"
          placeholder="Subscription End Date"
          value={subscriptionDate}
          disabled={isPending}
          onChange={(e) => setSubscriptionDate(e.target.value)}
        />

        {/* Submit */}
        <PrimaryButton
          className="my-1"
          type="button"
          disabled={isPending || !backup}
          onClick={handleImport}
        >
          {isPending ? "Starting..." : "Import"}
        </PrimaryButton>
      </div>
    </CloudCenteredDialog>
  );
}
