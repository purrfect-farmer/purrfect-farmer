import toast from "react-hot-toast";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { useCallback } from "react";
import { useMemo } from "react";

import HrumFullscreenSpinner from "./HrumFullscreenSpinner";
import useHrumOpenMutation from "../hooks/useHrumOpenMutation";
import useFarmerAutoTask from "@/drops/notpixel/hooks/useFarmerAutoTask";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function HrumOpenButton({ queries }) {
  const openMutation = useHrumOpenMutation();
  const [allData] = queries.data;
  const { processNextTask } = useFarmerContext();

  /** Should Show? */
  const show = useMemo(() => {
    return allData.hero.cookies > 0;
  }, [allData]);

  const [openCookie, dispatchAndOpenCookie] = useSocketDispatchCallback(
    /** Configure Settings */
    useCallback(async () => {
      if (show) {
        try {
          await openMutation.mutateAsync();

          /** Show Success Message */
          toast.success("Opened Cookie Successfully!");

          /** Refetch Queries */
          queries.query.forEach((query) => query.refetch());
        } catch {
          /** Show Error Message */
          toast.error("Failed to Open Cookie!");
        }
      }

      /** Process Next Task */
      processNextTask();
    }, [queries, show, processNextTask]),

    /** Dispatch */
    useCallback(
      (socket) =>
        socket.dispatch({
          action: "hrum.fortune-cookie",
        }),
      []
    )
  );

  /** Handlers */
  useSocketHandlers(
    useMemo(
      () => ({
        "hrum.fortune-cookie": () => {
          openCookie();
        },
      }),
      [openCookie]
    )
  );

  /** Auto-Claim */
  useFarmerAutoTask(
    "daily.cookie",
    () => {
      openCookie();
    },
    []
  );

  return (
    <>
      {show ? (
        <button
          onClick={dispatchAndOpenCookie}
          className="w-full px-4 py-2 uppercase bg-yellow-500 rounded-full"
        >
          Get A Prediction
        </button>
      ) : null}

      {openMutation.isPending ? <HrumFullscreenSpinner /> : null}
    </>
  );
}
