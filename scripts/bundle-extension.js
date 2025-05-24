import ChromeExtension from "crx";
import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { zip } from "zip-a-folder";

import { getPackageJson } from "./get-package-json.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = await getPackageJson();

const isBridge = Boolean(process.env.VITE_BRIDGE);
const isWhisker = Boolean(process.env.VITE_WHISKER);

const baseDir = isWhisker
  ? "../dist-whisker"
  : isBridge
  ? "../dist-bridge"
  : "../dist-extension";

const outDir = "../dist-bundle";

const file = `${
  pkg.name + (isWhisker ? "-whisker" : isBridge ? "-bridge" : "")
}-v${pkg.version}`;

/** Create Directory */
try {
  await fs.mkdir(path.resolve(__dirname, outDir), { recursive: true });
} catch (e) {
  console.error(e);
}

/** Create Zip */
await zip(
  path.resolve(__dirname, baseDir),
  path.resolve(__dirname, `${outDir}/${file}.zip`)
);

/** Create CRX */
await new ChromeExtension({
  privateKey:
    process.env.EXTENSION_PRIVATE_KEY || (await fs.readFile("./dist.pem")),
})
  .load(path.resolve(__dirname, baseDir))
  .then((crx) => crx.pack())
  .then((crxBuffer) =>
    fs.writeFile(path.resolve(__dirname, `${outDir}/${file}.crx`), crxBuffer)
  )
  .catch((err) => {
    console.error(err);
  });
