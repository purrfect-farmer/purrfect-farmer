import { StonApiClient } from "@ston-fi/api";
import { dexFactory } from "@ston-fi/sdk";
import Decimal from "decimal.js";

/** STON.fi swap helpers: the API quotes the swap and names the router, the SDK builds the message */

/** STON.fi addresses native TON with this sentinel rather than a jetton master */
export const TON_ASSET_ADDRESS =
  "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";

/** Referral fee in base points. v1 routers ignore this and always charge 10. */
export const REFERRAL_FEE_BPS = 10;

/** Swap directions */
export const JETTON_TO_TON = "jettonToTon";
export const TON_TO_JETTON = "tonToJetton";

/** Assets a drop without a TON pool can route through, VIC only pairs with USDT */
export const ROUTE_ASSETS = [
  { address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs", symbol: "USDT" },
];

/** TON always has 9 decimals; the drop's jetton comes from `prepareMaster` */
export const TON_DECIMALS = 9;

/** Slippage tolerances the swap forms offer */
export const SLIPPAGE_OPTIONS = [
  { value: "0.005", label: "0.5%" },
  { value: "0.01", label: "1%" },
  { value: "0.03", label: "3%" },
];

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

/** Ask STON.fi what this swap would return, which also carries the router `buildSwapTxParams` needs */
export async function simulateAutoSwap({
  offerAddress,
  askAddress,
  offerUnits,
  slippageTolerance,
  referralAddress,
  dexVersion,
}) {
  try {
    return await stonApi.simulateSwap({
      offerAddress,
      askAddress,
      offerUnits,
      slippageTolerance: String(slippageTolerance),
      ...(dexVersion ? { dexVersion } : {}),
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

/** Simulate the direct pair and every two-hop route through `ROUTE_ASSETS`, returning whichever pays the most
 * @returns {Promise<object>} - { hops: [simulation, simulation?], via? }
 */
export async function simulateRoute({
  direction,
  jettonAddress,
  offerUnits,
  slippageTolerance,
  referralAddress,
}) {
  const [offerAddress, askAddress] =
    direction === JETTON_TO_TON
      ? [jettonAddress, TON_ASSET_ADDRESS]
      : [TON_ASSET_ADDRESS, jettonAddress];

  const direct = async () => ({
    hops: [
      await simulateAutoSwap({
        offerAddress,
        askAddress,
        offerUnits,
        slippageTolerance,
        referralAddress,
      }),
    ],
  });

  const multiHop = async (via) => {
    /* Only v2 routers forward a custom payload, which is what chains the legs */
    const first = await simulateAutoSwap({
      offerAddress,
      askAddress: via.address,
      offerUnits,
      slippageTolerance,
      dexVersion: [2],
    });

    /* The referral sits on the final leg only, so the fee is charged once */
    const second = await simulateAutoSwap({
      offerAddress: via.address,
      askAddress,
      offerUnits: first.askUnits,
      slippageTolerance,
      referralAddress,
      dexVersion: [2],
    });

    return { hops: [first, second], via };
  };

  /* A pool existing says nothing about its depth, so every route is priced */
  const settled = await Promise.allSettled([
    direct(),
    ...ROUTE_ASSETS.map(multiHop),
  ]);

  const routes = settled
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value);

  if (routes.length === 0) {
    const failure = settled.find((result) => !result.reason?.unavailable);

    if (failure) throw failure.reason;

    throw new SwapUnavailableError("No STON.fi route exists for this pair");
  }

  return routes.reduce((best, route) =>
    BigInt(route.hops.at(-1).askUnits) > BigInt(best.hops.at(-1).askUnits)
      ? route
      : best,
  );
}

/** Raised when STON.fi cannot swap this pair at all: the jetton is unlisted or has no pool */
export class SwapUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "SwapUnavailableError";
    this.unavailable = true;
  }
}

/** STON.fi reports a missing pool as 1010 and an unlisted asset as 1040, both in the response body */
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

/** Look up an asset on STON.fi, which doubles as the availability check for a drop */
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

/** Referral params for a router, v1 routers having a fixed fee */
function buildReferral(routerInfo, referralAddress) {
  if (!referralAddress) return {};

  return {
    referralAddress,
    ...(routerInfo.majorVersion > 1 ? { referralValue: REFERRAL_FEE_BPS } : {}),
  };
}

/** Turn a route into a signable message
 * @returns {Promise<object>} - SenderArguments: { to, value, body }
 */
export async function buildSwapTxParams({
  client,
  route,
  direction,
  userWalletAddress,
  referralAddress,
  queryId,
}) {
  const [first, second] = route.hops;
  const routerInfo = first.router;
  const contracts = dexFactory(routerInfo);

  const router = client.open(contracts.Router.create(routerInfo.address));
  const proxyTon = contracts.pTON.create(routerInfo.ptonMasterAddress);

  const shared = {
    userWalletAddress,
    offerAmount: first.offerUnits,
    minAskAmount: first.minAskUnits,
    proxyTon,
    queryId,
  };

  if (!second) {
    const single = { ...shared, ...buildReferral(routerInfo, referralAddress) };

    return direction === JETTON_TO_TON
      ? router.getSwapJettonToTonTxParams({
          ...single,
          offerJettonAddress: first.offerAddress,
        })
      : router.getSwapTonToJettonTxParams({
          ...single,
          askJettonAddress: first.askAddress,
        });
  }

  /* Two hops: the first router pays the middle asset to the second with a swap body, a short leg refunds it */
  const nextInfo = second.router;
  const nextRouter = dexFactory(nextInfo).Router.create(nextInfo.address);
  const nextForwardGas = BigInt(second.gasParams.forwardGas);

  const dexCustomPayload = await nextRouter.createSwapBody({
    askJettonWalletAddress: second.askJettonWallet,
    receiverAddress: userWalletAddress,
    refundAddress: userWalletAddress,
    minAskAmount: second.minAskUnits,
    ...buildReferral(nextInfo, referralAddress),
  });

  const hop = {
    ...shared,
    receiverAddress: nextInfo.address,
    dexCustomPayload,
    dexCustomPayloadForwardGasAmount: nextForwardGas,
    forwardGasAmount: BigInt(first.gasParams.forwardGas) + nextForwardGas,
  };

  return direction === JETTON_TO_TON
    ? router.getSwapJettonToJettonTxParams({
        ...hop,
        offerJettonAddress: first.offerAddress,
        askJettonAddress: first.askAddress,
        askJettonWalletAddress: first.askJettonWallet,
        gasAmount:
          BigInt(first.gasParams.gasBudget ?? first.gasParams.forwardGas) +
          nextForwardGas,
      })
    : router.getSwapTonToJettonTxParams({
        ...hop,
        askJettonAddress: first.askAddress,
        askJettonWalletAddress: first.askJettonWallet,
      });
}
