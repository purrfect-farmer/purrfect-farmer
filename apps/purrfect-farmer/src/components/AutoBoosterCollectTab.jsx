import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import LabelToggle from "./LabelToggle";
import PrimaryButton from "./PrimaryButton";
import useAppContext from "@/hooks/useAppContext";
import useAuto from "@/hooks/useAuto";
import useAutoCloudSingleCollectMutation from "@/hooks/useAutoCloudSingleCollectMutation";
import useAutoSingleCollectMutation from "@/hooks/useAutoSingleCollectMutation";
import useCloudQueryOptions from "@/hooks/useCloudQueryOptions";

export default function AutoBoosterCollectTab({ account }) {
  const { config } = useAuto();
  const { settings, dispatchAndConfigureSettings } = useAppContext();
  const { enabled: cloudEnabled } = useCloudQueryOptions();

  const localMutation = useAutoSingleCollectMutation();
  const cloudMutation = useAutoCloudSingleCollectMutation();

  const useCloud = cloudEnabled && settings.useCloudForBooster;
  const mutation = useCloud ? cloudMutation : localMutation;

  const handleCollect = () => {
    mutation.mutate({ account });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Checks this account's {config.token} balance, sends TON from master,
        then returns
        {config.token} and remaining TON back to master.
      </Alert>

      {mutation.isSuccess && (
        <>
          <Alert variant={mutation.data.status ? "success" : "info"}>
            {mutation.data.status
              ? `Collected ${mutation.data.collected} ${config.token}`
              : mutation.data.skipped
                ? "Skipped - no jetton balance found."
                : `Failed: ${mutation.data.error?.message || "Unknown error"}`}
          </Alert>
          <PrimaryButton type="button" onClick={() => mutation.reset()}>
            <HiArrowPath className="w-4 h-4" />
            Reset
          </PrimaryButton>
        </>
      )}

      {mutation.isError && (
        <>
          <Alert variant="danger">{mutation.error.message}</Alert>
          <PrimaryButton type="button" onClick={() => mutation.reset()}>
            <HiArrowPath className="w-4 h-4" />
            Reset
          </PrimaryButton>
        </>
      )}

      {!mutation.isSuccess && !mutation.isError && (
        <>
          {/* Runs the same collection in the Cloud, which is far quicker than the browser */}
          {cloudEnabled && (
            <LabelToggle
              disabled={mutation.isPending}
              checked={Boolean(settings.useCloudForBooster)}
              onChange={(ev) =>
                dispatchAndConfigureSettings(
                  "useCloudForBooster",
                  ev.target.checked,
                )
              }
            >
              Use Cloud
            </LabelToggle>
          )}

          <PrimaryButton disabled={mutation.isPending} onClick={handleCollect}>
            {mutation.isPending ? "Collecting..." : "Collect"}
          </PrimaryButton>
        </>
      )}
    </div>
  );
}
