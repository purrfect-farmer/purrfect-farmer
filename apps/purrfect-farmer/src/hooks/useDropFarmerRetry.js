import { toRetryCount } from "@purrfect/shared/utils/retry.js";
import { useCallback, useMemo, useRef } from "react";

/** A hook for tracking a drop's farmer re-bootstraps across its terminal remounts */
export default function useDropFarmerRetry(farmerRetries) {
  const stateRef = useRef({ attempt: 1, pending: false });

  /** Whether a re-bootstrapped run is waiting to start */
  const hasPendingRetry = useCallback(() => stateRef.current.pending, []);

  /** The attempt a starting run is on, with a fresh start beginning at 1 */
  const beginRun = useCallback(() => {
    const state = stateRef.current;

    if (!state.pending) {
      state.attempt = 1;
    }

    state.pending = false;

    return state.attempt;
  }, []);

  /** The next attempt after a failed run, or null once the retries run out */
  const nextAttempt = useCallback(() => {
    const state = stateRef.current;
    const attempts = 1 + toRetryCount(farmerRetries);

    if (state.attempt >= attempts) {
      return null;
    }

    state.attempt += 1;
    state.pending = true;

    return { attempt: state.attempt, attempts };
  }, [farmerRetries]);

  return useMemo(
    () => ({ hasPendingRetry, beginRun, nextAttempt }),
    [hasPendingRetry, beginRun, nextAttempt],
  );
}
