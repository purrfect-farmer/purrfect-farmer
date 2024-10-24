import useFarmerApi from "@/hooks/useFarmerApi";
import { CgSpinner } from "react-icons/cg";
import { useEffect } from "react";
import { useState } from "react";

import NotPixelApp from "./NotPixelApp";
import NotPixelIcon from "../assets/images/icon.png?format=webp&w=128";
import NotPixelTemplate from "../assets/images/notpixel-template.png?format=webp";
import useNotPixelData from "../hooks/useNotPixelData";
import useNotPixelDiff from "../hooks/useNotPixelDiff";
import useNotPixelSocket from "../hooks/useNotPixelSocket";

export default function NotPixelFarmer({ sandboxRef }) {
  const api = useFarmerApi();
  const {
    started,
    pixels,
    worldPixels,
    updatedAt,
    updateWorldPixels,
    configureNotPixel,
  } = useNotPixelData();
  const diff = useNotPixelDiff(pixels, worldPixels);
  const [showNoTemplateError, setShowNoTemplateError] = useState(false);

  /** Initiate socket */
  const { connected } = useNotPixelSocket(
    started,
    sandboxRef,
    updateWorldPixels
  );

  /** Get NotPixel */
  useEffect(() => {
    (async function () {
      let items = [];

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
      } catch {}

      if (items.length) {
        /** Configure the App */
        configureNotPixel(items);
      } else {
        setShowNoTemplateError(true);
      }
    })();
  }, [configureNotPixel, setShowNoTemplateError]);

  return (
    <>
      {connected ? (
        <NotPixelApp diff={diff} updatedAt={updatedAt} />
      ) : (
        <div className="flex flex-col items-center justify-center gap-4 p-4 grow">
          {showNoTemplateError ? (
            <>
              <img src={NotPixelIcon} className="w-16 h-16 rounded-full" />
              <p className="p-4 text-center text-white bg-red-500 rounded-lg">
                Oops! Please select a template in Not Pixel before proceeding.
              </p>
              <img src={NotPixelTemplate} className="rounded-lg" />
            </>
          ) : (
            <CgSpinner className="w-5 h-5 mx-auto animate-spin" />
          )}
        </div>
      )}
    </>
  );
}
