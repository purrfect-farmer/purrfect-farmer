import FarmerNotification from "@/components/FarmerNotification";
import toast from "react-hot-toast";
import { createElement, useLayoutEffect } from "react";

export default function useDropFarmerToast({
  id,
  title,
  icon,
  started = false,
  onClick,
}) {
  useLayoutEffect(() => {
    if (started) {
      toast.success(
        (t) =>
          createElement(FarmerNotification, {
            t,
            id,
            title,
            onClick,
          }),
        {
          icon: createElement("img", {
            src: icon,
            className: "w-6 h-6 rounded-full",
          }),
          id: `${id}-farmer`,
          duration: 2000,
        }
      );
    }

    return () => {
      toast.dismiss(`${id}-farmer`);
    };
  }, [id, title, icon, started, onClick]);
}
