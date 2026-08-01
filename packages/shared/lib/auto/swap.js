import { StonApiClient } from "@ston-fi/api";
import { dexFactory } from "@ston-fi/sdk";
import Decimal from "decimal.js";

/**
 * STON.fi swap helpers.
 *
 * The API quotes the swap and tells us which router to use; the SDK turns that
 * quote into a message we sign with the master wallet, exactly like the jetton
 * transfers in `transactions.js`.
 */

/** STON.fi addresses native TON with this sentinel rather than a jetton master */
export const TON_ASSET_ADDRESS =
  "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";

/** Referral fee in base points. v1 routers ignore this and always charge 10. */
export const REFERRAL_FEE_BPS = 10;

/** Swap directions */
export const JETTON_TO_TON = "jettonToTon";
export const TON_TO_JETTON = "tonToJetton";

/** TON always has 9 decimals; the drop's jetton comes from `prepareMaster` */
export const TON_DECIMALS = 9;

const stonApi = new StonApiClient();

/** Convert a human amount to the integer units the API and SDK expect */
export function toUnits(amount, decimals) {
  return new Decimal(amount)
    .mul(new Decimal(10).pow(decimals))
    .floor()
    .toFixed(0);
}

/** Convert integer units back to a human `Decimal` */
export function fromUnits(units, decimals) {
  return new Decimal(units.toString()).div(new Decimal(10).pow(decimals));
}

/** Resolve the offer/ask side of a swap from its direction */
export function resolveSwapAssets(direction, jettonAddress, jettonDecimals) {
  return direction === JETTON_TO_TON
    ? {
        offerAddress: jettonAddress,
        offerDecimals: jettonDecimals,
        askAddress: TON_ASSET_ADDRESS,
        askDecimals: TON_DECIMALS,
      }
    : {
        offerAddress: TON_ASSET_ADDRESS,
        offerDecimals: TON_DECIMALS,
        askAddress: jettonAddress,
        askDecimals: jettonDecimals,
      };
}

/**
 * Ask STON.fi what this swap would return.
 *
 * The response carries the `router` metadata `buildSwapTxParams` needs, so a
 * simulation is required before every swap - it is not just for display.
 */
export async function simulateAutoSwap({
  offerAddress,
  askAddress,
  offerUnits,
  slippageTolerance,
  referralAddress,
}) {
  try {
    return await stonApi.simulateSwap({
      offerAddress,
      askAddress,
      offerUnits,
      slippageTolerance: String(slippageTolerance),
      ...(referralAddress
        ? {
            referralAddress,
            referralFeeBps: String(REFERRAL_FEE_BPS),
          }
        : {}),
    });
  } catch (error) {
    /* Not every drop's jetton is tradeable on STON.fi, so this is an expected
     * outcome rather than a bug - give the UI something it can explain. */
    if (isNoPoolError(error) || isUnlistedAssetError(error)) {
      throw new SwapUnavailableError(
        "No STON.fi liquidity pool exists for this pair",
      );
    }

    throw error;
  }
}

/**
 * Raised when STON.fi cannot swap this pair at all - either the jetton is not
 * listed or no pool exists. Not every drop's token is tradeable there, so the
 * UI treats this as a state to explain rather than an error to report.
 */
export class SwapUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "SwapUnavailableError";
    this.unavailable = true;
  }
}

/**
 * STON.fi reports a missing pool as code 1010 and an unlisted asset as 1040,
 * both in the response body. The client is ofetch-based, so the body is on
 * `error.data` - `error.message` only ever says "400 Bad Request".
 */
function readErrorBody(error) {
  return [error?.data, error?.response?._data]
    .filter(Boolean)
    .map((value) => (typeof value === "string" ? value : JSON.stringify(value)))
    .join(" ");
}

function isNoPoolError(error) {
  return /1010|could not find pool/i.test(readErrorBody(error));
}

function isUnlistedAssetError(error) {
  return /1040|could not find asset/i.test(readErrorBody(error));
}

/**
 * Look up an asset on STON.fi. Doubles as the availability check for a drop:
 * a token STON.fi has never heard of cannot be swapped there.
 */
export async function getSwapAsset(address) {
  try {
    return await stonApi.getAsset(address);
  } catch (error) {
    if (isUnlistedAssetError(error)) {
      throw new SwapUnavailableError("This token is not listed on STON.fi");
    }

    throw error;
  }
}

/**
 * Turn a simulation into a signable message.
 *
 * @returns {Promise<object>} - SenderArguments: { to, value, body }
 */
export async function buildSwapTxParams({
  client,
  simulation,
  direction,
  userWalletAddress,
  referralAddress,
  queryId,
}) {
  const routerInfo = simulation.router;
  const contracts = dexFactory(routerInfo);

  const router = client.open(contracts.Router.create(routerInfo.address));
  const proxyTon = contracts.pTON.create(routerInfo.ptonMasterAddress);

  const referral = referralAddress
    ? {
        referralAddress,
        /* v1 routers have a fixed referral fee and reject the parameter */
        ...(routerInfo.majorVersion > 1
          ? { referralValue: REFERRAL_FEE_BPS }
          : {}),
      }
    : {};

  const shared = {
    userWalletAddress,
    offerAmount: simulation.offerUnits,
    minAskAmount: simulation.minAskUnits,
    proxyTon,
    queryId,
    ...referral,
  };

  return direction === JETTON_TO_TON
    ? router.getSwapJettonToTonTxParams({
        ...shared,
        offerJettonAddress: simulation.offerAddress,
      })
    : router.getSwapTonToJettonTxParams({
        ...shared,
        askJettonAddress: simulation.askAddress,
      });
}
