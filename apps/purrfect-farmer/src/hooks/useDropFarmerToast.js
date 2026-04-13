import { createElement, useLayoutEffect } from "react";

import FarmerNotification from "@/components/FarmerNotification";
import toast from "react-hot-toast";
import useMemoizedCallback from "./useMemoizedCallback";

export default function useDropFarmerToast({
  id,
  title,
  icon,
  started = false,
  onClick,
}) {
  const onToastClick = useMemoizedCallback(onClick);

  useLayoutEffect(() => {
    if (started) {
      toast.success(
        (t) =>
          createElement(FarmerNotification, {
            t,
            id,
            title,
            onClick: onToastClick,
          }),
        {
          icon: createElement("img", {
            src: icon,
            className: "size-6 rounded-full",
          }),
          id: `${id}-farmer`,
          duration: 2000,
        },
      );
    }

    return () => {
      toast.dismiss(`${id}-farmer`);
    };
  }, [id, title, icon, started, onToastClick]);
}
