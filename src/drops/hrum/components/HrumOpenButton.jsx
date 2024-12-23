import toast from "react-hot-toast";
import useFarmerAutoTask from "@/hooks/useFarmerAutoTask";
import useFarmerContext from "@/hooks/useFarmerContext";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import { delay } from "@/lib/utils";
import { memo } from "react";
import { useMemo } from "react";

import HrumFullscreenSpinner from "./HrumFullscreenSpinner";
import useHrumOpenMutation from "../hooks/useHrumOpenMutation";

export default memo(function HrumOpenButton({ queries }) {
  const openMutation = useHrumOpenMutation();
  const [allData] = queries.data;
  const { processNextTask } = useFarmerContext();

  /** Should Show? */
  const show = useMemo(() => {
    return allData.hero.cookies > 0;
  }, [allData]);

  const [openCookie, dispatchAndOpenCookie] = useSocketDispatchCallback(
    "hrum.open-cookie",
    async () => {
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

      /** Little Delay */
      await delay(500);

      /** Process Next Task */
      processNextTask();
    },
    [queries, show, processNextTask]
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
          onClick={() => dispatchAndOpenCookie()}
          className="w-full px-4 py-2 uppercase bg-yellow-500 rounded-full"
        >
          Get A Prediction
        </button>
      ) : null}

      {openMutation.isPending ? <HrumFullscreenSpinner /> : null}
    </>
  );
});
