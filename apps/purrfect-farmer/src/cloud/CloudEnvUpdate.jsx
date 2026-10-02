import CloudCenteredDialog from "./CloudCenteredDialog";
import CloudEnvAdvanced from "./CloudEnvAdvanced";
import CloudEnvBackups from "./CloudEnvBackups";
import CloudEnvReview from "./CloudEnvReview";
import CloudEnvSettings from "./CloudEnvSettings";
import Tabs from "@/components/Tabs";
import toast from "react-hot-toast";
import useCloudManagerEnvMutation from "@/hooks/useCloudManagerEnvMutation";
import useMirroredTabs from "@/hooks/useMirroredTabs";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

/** Time to wait for the server to come back after a restart */
const RESTART_DELAY = 8000;

const EnvEditor = () => {
  const queryClient = useQueryClient();
  const tabs = useMirroredTabs(
    "cloud-env-panel",
    ["settings", "advanced", "backups"],
    "settings",
  );

  const envMutation = useCloudManagerEnvMutation();
  const [review, setReview] = useState(null);

  /** Reload everything env related */
  const reloadEnv = () =>
    queryClient.resetQueries({
      queryKey: ["app", "cloud", "manager", "env"],
    });

  /** Save the reviewed change */
  const confirm = async (restart) => {
    try {
      await envMutation.mutateAsync({ ...review.target, restart });
    } catch {
      return;
    }

    setReview(null);

    if (restart) {
      toast.success("Saved! Server is restarting...");
      setTimeout(reloadEnv, RESTART_DELAY);
    } else {
      toast.success("Saved! Restart the server to apply.");
      reloadEnv();
    }
  };

  const onReview = (target, preview) => setReview({ target, preview });

  return (
    <>
      {review ? (
        <CloudEnvReview
          preview={review.preview}
          isPending={envMutation.isPending}
          onBack={() => setReview(null)}
          onConfirm={confirm}
        />
      ) : null}

      {/* Kept mounted while reviewing so edits survive going back */}
      <div className={review ? "hidden" : "contents"}>
        <Tabs tabs={tabs}>
          <Tabs.Content value="settings">
            <CloudEnvSettings onReview={onReview} />
          </Tabs.Content>

          <Tabs.Content value="advanced">
            {tabs.value === "advanced" ? (
              <CloudEnvAdvanced onReview={onReview} />
            ) : null}
          </Tabs.Content>

          <Tabs.Content value="backups">
            {tabs.value === "backups" ? (
              <CloudEnvBackups onReview={onReview} />
            ) : null}
          </Tabs.Content>
        </Tabs>
      </div>
    </>
  );
};

export default function CloudEnvUpdate() {
  return (
    <CloudCenteredDialog
      title={"Server Settings"}
      description={"Change how your cloud server runs."}
      className="max-w-3xl"
    >
      <EnvEditor />
    </CloudCenteredDialog>
  );
}
