import ChromeExtension from "crx";
import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { zip } from "zip-a-folder";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pkg = JSON.parse(await fs.readFile("./package.json", "utf8"));
const file = `${pkg.name}-v${pkg.version}`;

/** Create Directory */
try {
  await fs.mkdir(path.join(__dirname, "dist-extension"), { recursive: true });
} catch {}

/** Create Zip */
await zip(
  path.join(__dirname, "dist"),
  path.join(__dirname, `dist-extension/${file}.zip`)
);

/** Create CRX */
await new ChromeExtension({
  privateKey:
    process.env.EXTENSION_PRIVATE_KEY || (await fs.readFile("./dist.pem")),
})
  .load(path.resolve(__dirname, "./dist"))
  .then((crx) => crx.pack())
  .then((crxBuffer) => fs.writeFile(`dist-extension/${file}.crx`, crxBuffer))
  .catch((err) => {
    console.error(err);
  });
