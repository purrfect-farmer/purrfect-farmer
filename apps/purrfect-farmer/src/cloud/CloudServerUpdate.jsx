import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";

import CloudCenteredDialog from "./CloudCenteredDialog";
import useCloudManagerServerUpdateMutation from "@/hooks/useCloudManagerServerUpdateMutation";
import Alert from "@/components/Alert";
import AnsiToHtml from "ansi-to-html";
import { cn } from "@/utils";

const ansiToHtml = new AnsiToHtml();

const ServerUpdateContent = ({ title, output }) => {
  return (
    <>
      <h3
        className={cn(
          "font-semibold text-center uppercase",
          "text-neutral-500 dark:text-neutral-400"
        )}
      >
        {title}
      </h3>
      <pre
        className={cn(
          "overflow-auto bg-black text-white p-2 max-h-96",
          "font-mono whitespace-pre-wrap wrap-break-word"
        )}
        dangerouslySetInnerHTML={{
          __html: ansiToHtml.toHtml(output) || "No output available.",
        }}
      />
    </>
  );
};

const ServerUpdateDetails = ({ data }) => {
  return (
    <div className="flex flex-col gap-2">
      {data.stdout && (
        <ServerUpdateContent title="Output" output={data.stdout} />
      )}
      {data.stderr && (
        <ServerUpdateContent title="Warnings / Errors" output={data.stderr} />
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
        {serverUpdateMutation.data ? (
          <>
            {/* Update Status Alert */}
            <Alert
              variant={serverUpdateMutation.data.success ? "success" : "danger"}
            >
              {serverUpdateMutation.data.success
                ? "Server updated successfully! The server is restarting..."
                : `Server update failed with code ${serverUpdateMutation.data.code}. Please check the details below.`}
            </Alert>

            {/* Update Details */}
            <ServerUpdateDetails data={serverUpdateMutation.data} />
          </>
        ) : (
          <>
            <Alert variant={"warning"}>
              Updating your server may cause temporary downtime. Please be
              patient while the update is in progress.
            </Alert>
            {/* Update Button */}
            <PrimaryButton disabled={isPending} onClick={updateServer}>
              {isPending ? "Updating..." : "Update"}
            </PrimaryButton>
          </>
        )}
      </div>
    </CloudCenteredDialog>
  );
}
