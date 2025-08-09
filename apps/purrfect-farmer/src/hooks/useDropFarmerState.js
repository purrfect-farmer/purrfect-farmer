import { useCallback } from "react";
import { useState } from "react";

export default function useDropFarmerState() {
  const [initResetCount, setInitResetCount] = useState(0);
  const [hasStartedManually, setHasStartedManually] = useState(false);
  const [hasConfiguredApi, setHasConfiguredApi] = useState(false);
  const [hasConfiguredAuthHeaders, setHasConfiguredAuthHeaders] =
    useState(false);

  /** Reset States */
  const resetStates = useCallback(() => {
    setHasStartedManually(false);
    setHasConfiguredApi(false);
    setHasConfiguredAuthHeaders(false);
  }, []);

  return {
    initResetCount,
    hasStartedManually,
    hasConfiguredApi,
    hasConfiguredAuthHeaders,
    setInitResetCount,
    setHasStartedManually,
    setHasConfiguredApi,
    setHasConfiguredAuthHeaders,
    resetStates,
  };
}
