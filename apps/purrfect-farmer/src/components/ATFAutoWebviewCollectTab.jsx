import Alert from "./Alert";
import PrimaryButton from "./PrimaryButton";
import useATFAutoSingleCollectMutation from "@/hooks/useATFAutoSingleCollectMutation";

export default function ATFAutoWebviewCollectTab({ account }) {
  const mutation = useATFAutoSingleCollectMutation();

  const handleCollect = () => {
    mutation.mutate({ account });
  };

  return (
    <div className="flex flex-col gap-3">
      <Alert variant="info">
        Checks this account's ATF jetton balance, sends gas TON from master,
        then returns jettons and remaining TON back to master.
      </Alert>

      {mutation.isSuccess && (
        <>
          <Alert variant={mutation.data.status ? "success" : "info"}>
            {mutation.data.status
              ? "Collection completed!"
              : mutation.data.skipped
                ? "Skipped — no jetton balance found."
                : `Failed: ${mutation.data.error?.message || "Unknown error"}`}
          </Alert>
          <PrimaryButton onClick={() => mutation.reset()}>
            Reset
          </PrimaryButton>
        </>
      )}

      {mutation.isError && (
        <>
          <Alert variant="danger">{mutation.error.message}</Alert>
          <PrimaryButton onClick={() => mutation.reset()}>
            Reset
          </PrimaryButton>
        </>
      )}

      {!mutation.isSuccess && !mutation.isError && (
        <PrimaryButton
          disabled={mutation.isPending}
          onClick={handleCollect}
        >
          {mutation.isPending ? "Collecting..." : "Collect"}
        </PrimaryButton>
      )}
    </div>
  );
}
