import toast from "react-hot-toast";
import useSocketDispatchCallback from "@/hooks/useSocketDispatchCallback";
import useSocketHandlers from "@/hooks/useSocketHandlers";
import { useCallback } from "react";
import { useMemo } from "react";

import HrumFullscreenSpinner from "./HrumFullscreenSpinner";
import useHrumOpenMutation from "../hooks/useHrumOpenMutation";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function HrumOpenButton() {
  const { allDataRequest } = useFarmerContext();
  const openMutation = useHrumOpenMutation();

  /** All Data */
  const allData = allDataRequest.data.data;

  /** Should Show? */
  const show = useMemo(() => {
    return allData.hero.cookies > 0;
  }, [allData]);

  const [openCookie, dispatchAndOpenCookie] = useSocketDispatchCallback(
    /** Configure Settings */
    useCallback(async () => {
      if (!show) return;

      try {
        await openMutation.mutateAsync();

        /** Show Success Message */
        toast.success("Opened Cookie Successfully!");

        /** Update Data */
        allDataRequest.update((prev) => {
          return {
            ...prev,
            data: {
              ...prev.data,
              hero: {
                ...prev.data.hero,
                cookies: prev.data.hero.cookies - 1,
              },
            },
          };
        });
      } catch {
        /** Show Error Message */
        toast.error("Failed to Open Cookie!");
      }
    }, [allDataRequest.update, show]),

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
