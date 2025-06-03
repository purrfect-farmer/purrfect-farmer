import pako from "pako";
import { customLogger } from "@/lib/utils";

export function getResponseData(textResponse) {
  if (textResponse.startsWith("{") || textResponse.startsWith("[")) {
    return JSON.parse(textResponse);
  } else {
    let compressedBytes = Uint8Array.from(atob(textResponse), (c) =>
      c.charCodeAt(0)
    );
    let decompressedBytes = pako.ungzip(compressedBytes);
    let decompressedText = new TextDecoder().decode(decompressedBytes);
    let jsonData = JSON.parse(decompressedText);

    customLogger("VOXEL RESPONSE", JSON.parse(decompressedText));

    return jsonData;
  }
}
