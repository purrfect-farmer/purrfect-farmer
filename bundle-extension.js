import ChromeExtension from "crx";
import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { zip } from "zip-a-folder";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isBridge = typeof process.env.VITE_BRIDGE !== "undefined";
const baseDir = isBridge ? "dist-bridge" : "dist";
const outDir = "dist-extension";

const pkg = JSON.parse(await fs.readFile("./package.json", "utf8"));
const file = `${pkg.name + (isBridge ? "-bridge" : "")}-v${pkg.version}`;

/** Create Directory */
try {
  await fs.mkdir(path.join(__dirname, outDir), { recursive: true });
} catch {}

/** Create Zip */
await zip(
  path.join(__dirname, baseDir),
  path.join(__dirname, `${outDir}/${file}.zip`)
);

/** Create CRX */
await new ChromeExtension({
  privateKey:
    process.env.EXTENSION_PRIVATE_KEY || (await fs.readFile("./dist.pem")),
})
  .load(path.join(__dirname, baseDir))
  .then((crx) => crx.pack())
  .then((crxBuffer) => fs.writeFile(`${outDir}/${file}.crx`, crxBuffer))
  .catch((err) => {
    console.error(err);
  });
