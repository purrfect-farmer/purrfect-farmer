import { useCallback } from "react";
import { useMemo } from "react";
import { useState } from "react";

import { getCoords, loadImage, rgbToHex } from "../lib/utils";

export default function useNotPixelData() {
  const [started, setStarted] = useState(false);
  const [pixels, setPixels] = useState({});
  const [worldPixels, setWorldPixels] = useState({});
  const [updatedAt, setUpdatedAt] = useState(() => Date.now());

  const updateWorldPixels = useCallback(
    (updates) => {
      setWorldPixels((prev) => {
        let newWorldPixels = { ...prev };

        for (let [pixelId, color] of updates) {
          if (pixelId in newWorldPixels) {
            newWorldPixels[pixelId] = {
              ...newWorldPixels[pixelId],
              color,
            };
          }
        }

        return newWorldPixels;
      });

      setUpdatedAt(Date.now());
    },
    [setWorldPixels, setUpdatedAt]
  );

  /** Configure Not Pixel Images */
  const configureNotPixel = useCallback(
    (data) => {
      console.log("---NOT PIXEL---");
      console.log(data);

      Promise.all(data.map(({ url }) => loadImage(url)))
        .then((images) => {
          const offscreenCanvas = new OffscreenCanvas(1000, 1000);
          const offscreenCtx = offscreenCanvas.getContext("2d", {
            willReadFrequently: true,
          });

          /** Map Items */
          const items = data.map((item, index) => {
            /** X */
            const x =
              Math.sign(item.x) === -1
                ? offscreenCanvas.width + item.x
                : item.x;

            /** Y */
            const y =
              Math.sign(item.y) === -1
                ? offscreenCanvas.height + item.y
                : item.y;

            return {
              ...item,
              x,
              y,
              image: images[index],
            };
          });

          /** Get Pixels */
          const getPixels = () =>
            items.reduce((result, item) => {
              const data = offscreenCtx.getImageData(
                item.x,
                item.y,
                item.size,
                item.size
              ).data;

              for (let i = 0; i < data.length; i += 4) {
                let [r, g, b, a] = [
                  data[i + 0],
                  data[i + 1],
                  data[i + 2],
                  data[i + 3],
                ];

                let pos = i / 4;
                let { x, y, positionX, positionY, offset } = getCoords(
                  pos,
                  item
                );
                let pixelId = offset + 1;

                /** Set Color */
                result[pixelId] = {
                  x,
                  y,
                  positionX,
                  positionY,
                  offset,
                  pixelId,
                  color: rgbToHex(r, g, b),
                };
              }

              return result;
            }, {});

          /** Draw Images */
          items.forEach((item) => {
            offscreenCtx.drawImage(
              item.image,
              item.x,
              item.y,
              item.size,
              item.size
            );
          });

          /** Set Items */
          setPixels(getPixels());

          /** Load Current World */
          loadImage("https://image.notpx.app/api/v2/image").then((image) => {
            /** Draw current world */
            offscreenCtx.drawImage(image, 0, 0);

            setWorldPixels(getPixels());
            setStarted(true);
          });
        })
        .catch((e) => {});
    },
    [setPixels, setWorldPixels]
  );

  return useMemo(
    () => ({
      started,
      pixels,
      worldPixels,
      updatedAt,
      updateWorldPixels,
      configureNotPixel,
    }),
    [
      started,
      pixels,
      worldPixels,
      updatedAt,
      updateWorldPixels,
      configureNotPixel,
    ]
  );
}
