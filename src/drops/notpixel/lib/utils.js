import rgbHex from "rgb-hex";
import { getDropMainScript } from "@/lib/utils";

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);

    image.src = src;
  });
}

export function imageDataToHexCallback(data, callback) {
  let result = [];

  for (let i = 0; i < data.length; i += 4) {
    let [r, g, b, a] = [data[i + 0], data[i + 1], data[i + 2], data[i + 3]];

    result.push(callback(rgbToHex(r, g, b)));
  }

  return result;
}

export function imageDataToHex(data) {
  return imageDataToHexCallback(data, (color) => color);
}

export function imageDataToPixel(data) {
  return imageDataToHexCallback(data, (color) => ({
    color,
    updatedAt: Date.now(),
  }));
}

export function rgbToPixel(...args) {
  return {
    color: rgbToHex(...args),
    updatedAt: Date.now(),
  };
}
export function rgbToHex(...args) {
  return "#" + rgbHex(...args).toUpperCase();
}

export function getCoords(index, item) {
  let x = index % item.size;
  let y = Math.floor(index / item.size);

  let positionX = item.x + x;
  let positionY = item.y + y;

  let offset = positionY * 1000 + positionX;

  return {
    x,
    y,
    positionX,
    positionY,
    offset,
  };
}

export async function getNotPixelGame() {
  if (getNotPixelGame.DATA) return getNotPixelGame.DATA;

  const scriptResponse = await getDropMainScript("https://app.notpx.app");

  try {
    let match = scriptResponse.match(
      /"template\/getWorldTemplate"[^{]+({[^}]+})/
    )[1];

    // X
    let x = match.match(/x:([^,]+),/)?.[1]?.replaceAll(/[^\d-]/g, "");

    // Y
    let y = match.match(/y:([^,]+),/)?.[1]?.replaceAll(/[^\d-]/g, "");

    // Size
    let size = match
      .match(/imageSize:([^,]+),/)?.[1]
      ?.replaceAll(/[^\d-]/g, "");

    // Image
    let urlVariable = match.match(/url:([^,]+),/)?.[1].trim();
    let urlPattern = `${urlVariable}="/assets/([^"]+)"`;
    let urlRegex = new RegExp(urlPattern);
    let url = scriptResponse.match(urlRegex)?.[1];

    let obj = {
      x: parseInt(x),
      y: parseInt(y),
      size: parseInt(size),
      url: `https://app.notpx.app/assets/${url}`,
    };

    return (getNotPixelGame.DATA = obj);
  } catch {}
}
