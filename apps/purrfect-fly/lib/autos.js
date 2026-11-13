import fs from "node:fs";
import path from "node:path";

import BaseAuto from "./BaseAuto.js";
import farmers from "../farmers/index.js";
import { getCurrentPath } from "./path.js";
import {
  getAutoCurrency,
  isNativeAuto,
} from "@purrfect/shared/lib/auto/native.js";

const { __dirname } = getCurrentPath(import.meta.url);

/** Every Auto's descriptor lives in its own file, kept after its drop's farmer is removed */
const autosDir = path.join(__dirname, "../node_modules/@purrfect/shared/autos");

/** The farmer this server runs for each Auto, keyed by auto id */
const autoFarmers = new Map(
  Object.values(farmers)
    .filter((FarmerClass) => FarmerClass.auto)
    .map((FarmerClass) => [FarmerClass.auto.id, FarmerClass]),
);

/** Builds the Auto subclass for a descriptor, with its own instances map and the farmer that runs its drop, if any */
export function createAuto(descriptor, FarmerClass = null) {
  const { id, title, token, jettonAddress, verifiable } = descriptor;
  const currency = getAutoCurrency(descriptor);
  const native = isNativeAuto(descriptor);

  return class Auto extends BaseAuto {
    static instances = new Map();
    static assistInstances = new Map();
    static cultivateInstances = new Map();
    static farmerId = FarmerClass?.id ?? null;
    static retired = !FarmerClass;
    static id = id;
    static title = title;
    static token = token;
    static currency = currency;
    static jettonAddress = jettonAddress || null;
    static native = native;
    static verifiable = Boolean(verifiable);
  };
}

/** Every Auto keyed by auto id, discovered from the descriptor files
 * @type {Record<string, ReturnType<typeof createAuto>>}
 */
const autos = {};

for (const entry of fs.readdirSync(autosDir).sort()) {
  if (!entry.endsWith(".js")) continue;

  const descriptor = await import(path.join(autosDir, entry)).then(
    (module) => module.default,
  );

  autos[descriptor.id] = createAuto(descriptor, autoFarmers.get(descriptor.id));
}

export default autos;
