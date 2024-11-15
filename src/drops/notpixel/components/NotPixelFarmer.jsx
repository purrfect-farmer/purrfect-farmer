import useFarmerContext from "@/hooks/useFarmerContext";
import { CgSpinner } from "react-icons/cg";
import { useEffect } from "react";

import NotPixelApp from "./NotPixelApp";
import NotPixelIcon from "../assets/images/icon.png?format=webp&w=128";
import NotPixelTemplate from "../assets/images/notpixel-template.png?format=webp";
import useNotPixelData from "../hooks/useNotPixelData";
import useNotPixelDiff from "../hooks/useNotPixelDiff";
import useNotPixelSocket from "../hooks/useNotPixelSocket";
import { delay } from "@/lib/utils";

export default function NotPixelFarmer({ sandboxRef }) {
  const { api, zoomies, processNextTask } = useFarmerContext();
  const {
    initiated,
    started,
    pixels,
    worldPixels,
    updatedAt,
    updateWorldPixels,
    configureNotPixel,
    connectedCallbackRef,
  } = useNotPixelData();
  const diff = useNotPixelDiff(pixels, worldPixels);

  /** Initiate socket */
  const { connected } = useNotPixelSocket({
    initiated,
    sandboxRef,
    updateWorldPixels,
    connectedCallbackRef,
  });

  /** Get NotPixel */
  useEffect(() => {
    let items = [];
    let controller = new AbortController();
    let timeout;

    /** Clear the Controller */
    const clearController = () => {
      /** Clear the Timeout */
      clearTimeout(timeout);

      /** Abort the controller */
      controller.abort();
    };

    (async function () {
      while (!items.length && !controller.signal.aborted) {
        try {
          const myTemplate = await api
            .get("https://notpx.app/api/v1/image/template/my")
            .then((res) => res.data);

          items.unshift({
            x: myTemplate.x,
            y: myTemplate.y,
            size: myTemplate.imageSize,
            url: myTemplate.url,
          });
        } catch {
          await delay(5000);
        }
      }

      if (items.length && !controller.signal.aborted) {
        /** Configure the App */
        configureNotPixel(items, clearController);
      }
    })();

    /** Abort after 15 Secs */
    if (zoomies.enabled) {
      timeout = setTimeout(() => {
        if (!controller.signal.aborted) {
          /** Abort */
          controller.abort();

          /** Process Next Task */
          processNextTask();
        }
      }, 15_000);
    }

    return () => {
      /** Clear the Controller */
      clearController();
    };
  }, [configureNotPixel]);

  return (
    <>
      {started && connected ? (
        <NotPixelApp diff={diff} updatedAt={updatedAt} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 p-4 grow">
          <img src={NotPixelIcon} className="w-16 h-16 rounded-full" />
          <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
          <p className="p-4 text-center text-yellow-800 bg-yellow-100 rounded-lg">
            Please ensure you have selected a template in Not Pixel before
            proceeding.
          </p>
          <img src={NotPixelTemplate} className="rounded-lg" />
        </div>
      )}
    </>
  );
}
