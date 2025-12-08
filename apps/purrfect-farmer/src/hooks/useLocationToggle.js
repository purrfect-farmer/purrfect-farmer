import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import useAccountContext from "./useAccountContext";

export default function useLocationToggle(key) {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useAccountContext();

  /* Determine Partition */
  const partition = account ? `account-${account.id}` : "core";

  /* Full State Key */
  const stateKey = `${partition}:${key}`;

  /** Determine Show State */
  const show = location.state?.[stateKey] === true;

  /** Toggle Location State */
  const toggle = useCallback(
    (status) => {
      if (status) {
        navigate(location, {
          state: {
            ...location.state,
            [stateKey]: true,
          },
        });
      } else {
        if (location.key !== "default") {
          navigate(-1);
        } else {
          navigate("/", { replace: true });
        }
      }
    },
    [stateKey, navigate, location]
  );

  return useMemo(() => [show, toggle], [show, toggle]);
}
