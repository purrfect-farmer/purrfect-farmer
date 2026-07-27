import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import PrimaryButton from "./PrimaryButton";
import useAuto from "@/hooks/useAuto";
import useAutoSingleCollectMutation from "@/hooks/useAutoSingleCollectMutation";

export default function AutoBoosterCollectTab({ account }) {
  const { config } = useAuto();
  const mutation = useAutoSingleCollectMutation();

  const handleCollect = () => {
    mutation.mutate({ account });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Checks this account's {config.token} balance, sends TON from master, then returns
        {config.token} and remaining TON back to master.
      </Alert>

      {mutation.isSuccess && (
        <>
          <Alert variant={mutation.data.status ? "success" : "info"}>
            {mutation.data.status
              ? `Collected ${mutation.data.collected} ${config.token}`
              : mutation.data.skipped
                ? "Skipped — no jetton balance found."
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
        <PrimaryButton disabled={mutation.isPending} onClick={handleCollect}>
          {mutation.isPending ? "Collecting..." : "Collect"}
        </PrimaryButton>
      )}
    </div>
  );
}
