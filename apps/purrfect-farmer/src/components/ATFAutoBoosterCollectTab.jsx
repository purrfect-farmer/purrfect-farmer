import Alert from "./Alert";
import { HiArrowPath } from "react-icons/hi2";
import PrimaryButton from "./PrimaryButton";
import useATFAutoSingleCollectMutation from "@/hooks/useATFAutoSingleCollectMutation";

export default function ATFAutoBoosterCollectTab({ account }) {
  const mutation = useATFAutoSingleCollectMutation();

  const handleCollect = () => {
    mutation.mutate({ account });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Checks this account's ATF balance, sends TON from master, then returns
        ATF and remaining TON back to master.
      </Alert>

      {mutation.isSuccess && (
        <>
          <Alert variant={mutation.data.status ? "success" : "info"}>
            {mutation.data.status
              ? `Collected ${mutation.data.collected} ATF`
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
