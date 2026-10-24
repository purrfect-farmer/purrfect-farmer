import Decimal from "decimal.js";
import { LOOT_DECIMALS } from "./constants.js";

/** A nano amount, as the drop sends it, in whole LOOT */
export function fromNano(value) {
  return new Decimal(String(value || 0)).div(
    new Decimal(10).pow(LOOT_DECIMALS),
  );
}
