import toast from "react-hot-toast";
import useAuto from "./useAuto";
import useAutoCloudBoostMutation from "./useAutoCloudBoostMutation";
import useAutoCloudCancellationMutation from "./useAutoCloudCancellationMutation";
import useAutoCloudCollectionMutation from "./useAutoCloudCollectionMutation";
import useAutoCloudStatusMutation from "./useAutoCloudStatusMutation";
import useAutoCloudWithdrawalMutation from "./useAutoCloudWithdrawalMutation";
import useAutoSweepMutation from "./useAutoSweepMutation";
import useAutoWhiskersResyncMutation from "./useAutoWhiskersResyncMutation";

/** The toast of a request dispatched to the cloud */
const dispatchToast = (error) => ({
  loading: "Dispatching...",
  success: "Dispatched",
  error,
});

/** A hook for the Auto dashboard's one-tap actions: cloud requests, sweeping and resyncing names */
export default function useAutoCloudActions() {
  const { password, master, accounts } = useAuto();

  const boostMutation = useAutoCloudBoostMutation();
  const withdrawMutation = useAutoCloudWithdrawalMutation();
  const collectMutation = useAutoCloudCollectionMutation();
  const statusMutation = useAutoCloudStatusMutation();
  const cancellationMutation = useAutoCloudCancellationMutation();
  const sweepMutation = useAutoSweepMutation();
  const resyncMutation = useAutoWhiskersResyncMutation();

  /** The cloud request of a mutation, sent with the master and accounts */
  const dispatch = (mutation, error) => () =>
    toast.promise(
      mutation.mutateAsync({ password, master, accounts }),
      dispatchToast(error),
    );

  return {
    boost: {
      run: dispatch(boostMutation, "Failed to dispatch boost request"),
      isPending: boostMutation.isPending,
    },
    withdraw: {
      run: dispatch(withdrawMutation, "Failed to dispatch withdrawal request"),
      isPending: withdrawMutation.isPending,
    },
    collect: {
      run: dispatch(collectMutation, "Failed to dispatch collection request"),
      isPending: collectMutation.isPending,
    },
    status: {
      run: dispatch(statusMutation, "Failed to dispatch status request"),
      isPending: statusMutation.isPending,
    },
    cancel: {
      run: () =>
        toast.promise(
          cancellationMutation.mutateAsync(),
          dispatchToast("Failed to dispatch cancellation request"),
        ),
      isPending: cancellationMutation.isPending,
    },
    sweep: {
      run: () =>
        toast.promise(sweepMutation.mutateAsync(), {
          loading: "Sweeping...",
          success: "Swept inactive accounts!",
          error: "Failed to sweep accounts!",
        }),
      isPending: sweepMutation.isPending,
    },
    resync: {
      run: () =>
        toast.promise(resyncMutation.mutateAsync(), {
          loading: "Resyncing...",
          success: ({ updated, missing }) =>
            `Renamed ${updated} account(s)` +
            (missing ? `, ${missing} not in Whiskers` : "") +
            ".",
          error: (error) => error.message,
        }),
      isPending: resyncMutation.isPending,
    },
  };
}
