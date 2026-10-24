import Decimal from "decimal.js";
import { getJettonBalance, getTonBalance } from "../ton/tonapi.js";
import { isNativeAuto } from "../auto/native.js";

/** The address' balance of the drop's jetton, or TON on a native Auto, straight from the chain
 * @param {ReturnType<import("./createFarmerCore.js").default>} core
 */
export function readOnChainHolding(core, address) {
  const auto = core.drop.auto;
  const read = isNativeAuto(auto)
    ? getTonBalance(address, { signal: core.signal })
    : getJettonBalance(auto.jettonAddress, address, { signal: core.signal });

  return read.catch((error) => {
    core.logger.warn("Failed to read the holding on-chain:", error.message);
    return new Decimal(0);
  });
}

/** Warn if the drop has moved to a different jetton than the Auto tracks
 * @param {ReturnType<import("./createFarmerCore.js").default>} core
 */
export function checkTokenContract(core, contract) {
  const auto = core.drop.auto;

  if (!contract || isNativeAuto(auto)) return;

  const expected = auto.jettonAddress;

  if (!core.utils.toRawAddress(contract)) {
    core.logger.warn("The drop names an unreadable token address:", contract);
    return;
  }

  if (!core.utils.isSameTonAddress(contract, expected)) {
    core.logger.warn(
      `The drop now names ${contract} as its token, not ${expected}.`,
    );
  }
}
