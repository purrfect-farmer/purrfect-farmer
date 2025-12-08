import PrimaryButton from "@/components/PrimaryButton";
import toast from "react-hot-toast";

import CloudCenteredDialog from "./CloudCenteredDialog";
import useCloudManagerServerUpdateMutation from "@/hooks/useCloudManagerServerUpdateMutation";
import Alert from "@/components/Alert";

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

        {/* Update Button */}
        <PrimaryButton disabled={isPending} onClick={updateServer}>
          {isPending ? "Updating..." : "Update"}
        </PrimaryButton>
      </div>
    </CloudCenteredDialog>
  );
}
