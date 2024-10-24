import { fetchContent, getDropMainScript } from "@/lib/utils";

export async function getBlumGame() {
  if (getBlumGame.DATA) return getBlumGame.DATA;
  const scriptResponse = await getDropMainScript(
    "https://telegram.blum.codes",
    "_dist"
  );

  try {
    let gameComponent = scriptResponse.match(
      /"\/game"[^"]+import\("([^"]+)"\)/
    )[1];

    let gameComponentSource = await fetchContent(
      new URL(gameComponent, "https://telegram.blum.codes/_dist/")
    );

    let worker = gameComponentSource.match(/"(game[^"]+\.js)"/)[1];
    let workerScript = new URL(worker, "https://telegram.blum.codes/_dist/");
    let workerResponse = await fetchContent(workerScript);

    /** WASM */
    let wasm = workerResponse.match(/"(game[^"]+\.wasm)"/)[1];
    let wasmPath = new URL(wasm, "https://telegram.blum.codes/_dist/");
    let wasmBlob = await fetchContent(wasmPath, {
      responseType: "blob",
    });
    let wasmBlobURL = URL.createObjectURL(wasmBlob);

    /** Worker Blob */
    let workerBlob = new Blob([workerResponse.replace(wasm, wasmBlobURL)], {
      type: "application/javascript",
    });
    let workerBlobURL = URL.createObjectURL(workerBlob);

    return (getBlumGame.DATA = {
      workerBlobURL,
      wasmBlobURL,
    });
  } catch {}
}
