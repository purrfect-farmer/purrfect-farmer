import { useEffect } from "react";

import NotPixelApp from "./NotPixelApp";
import NotPixelIcon from "../assets/images/icon.png?format=webp&w=128";
import NotPixelTemplate from "../assets/images/notpixel-template.png?format=webp";
import useNotPixelData from "../hooks/useNotPixelData";
import useNotPixelDiff from "../hooks/useNotPixelDiff";
import useNotPixelSocket from "../hooks/useNotPixelSocket";
import useFarmerContext from "@/hooks/useFarmerContext";
import { CgSpinner } from "react-icons/cg";

export default function NotPixelFarmer({ sandboxRef }) {
  const { templateRequest } = useFarmerContext();
  const {
    started,
    pixels,
    worldPixels,
    updatedAt,
    updateWorldPixels,
    configureNotPixel,
  } = useNotPixelData();
  const diff = useNotPixelDiff(pixels, worldPixels);

  /** Initiate socket */
  const { connected } = useNotPixelSocket(
    started,
    sandboxRef,
    updateWorldPixels
  );

  /** Get NotPixel */
  useEffect(() => {
    if (!templateRequest.data) return;

    (async function () {
      configureNotPixel([templateRequest.data]);
    })();
  }, [templateRequest.data, configureNotPixel]);

  return (
    <>
      {connected ? (
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
