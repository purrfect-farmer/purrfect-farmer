import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";

import CloudCenteredDialog from "./CloudCenteredDialog";
import useCloudManagerServerUpdateMutation from "@/hooks/useCloudManagerServerUpdateMutation";
import Alert from "@/components/Alert";
import AnsiToHtml from "ansi-to-html";
import { cn } from "@/lib/utils";

const ansiToHtml = new AnsiToHtml();

const ServerUpdateDetails = ({ data }) => {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-semibold text-center uppercase text-neutral-500">
        Update Details
      </h3>
      <pre
        className={cn(
          "overflow-auto bg-black text-white p-2 max-h-96",
          "font-mono whitespace-pre-wrap wrap-break-word"
        )}
        dangerouslySetInnerHTML={{
          __html: ansiToHtml.toHtml(data.stdout) || "No output available.",
        }}
      />
      {data.stderr && (
        <>
          <h4 className="font-semibold text-center uppercase text-neutral-500">
            Errors
          </h4>
          <pre
            className={cn(
              "overflow-auto bg-black text-white p-2 max-h-96",
              "font-mono whitespace-pre-wrap wrap-break-word"
            )}
            dangerouslySetInnerHTML={{ __html: ansiToHtml.toHtml(data.stderr) }}
          />
        </>
      )}
    </div>
  );
};

export default function CloudServerUpdate() {
  const serverUpdateMutation = useCloudManagerServerUpdateMutation();
  const isPending = serverUpdateMutation.isPending;

  const updateServer = () => {
    toast.promise(serverUpdateMutation.mutateAsync(), {
      loading: "Updating server...",
      success: "Server updated successfully!",
      error: (err) => `Error: ${err.message}`,
    });
  };

  return (
    <CloudCenteredDialog
      title={"Update Server"}
      description={
        "Click the button below to update your server to the latest version."
      }
    >
      <div className="flex flex-col gap-2">
        <Alert variant={"warning"}>
          Updating your server may cause temporary downtime. Please be patient
          while the update is in progress.
        </Alert>

        {serverUpdateMutation.data && (
          <ServerUpdateDetails data={serverUpdateMutation.data} />
        )}

        {/* Update Button */}
        <PrimaryButton disabled={isPending} onClick={updateServer}>
          {isPending ? "Updating..." : "Update"}
        </PrimaryButton>
      </div>
    </CloudCenteredDialog>
  );
}
