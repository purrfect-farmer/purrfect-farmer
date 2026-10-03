import Decimal from "decimal.js";
import { getJettonBalance, getTonBalance } from "../ton/tonapi.js";
import { queueBalanceRequest } from "./balanceBatcher.js";
import { isNativeJetton } from "./native.js";

/** TON and jetton balances of an address, the jetton always 0 on a native Auto */
export async function getBalances(jettonAddress, address, options) {
  /* Batched Toncenter path; one request covers up to 50 accounts */
  if (options?.apiKey) {
    try {
      return await queueBalanceRequest(jettonAddress, address, options);
    } catch (e) {
      console.log("Batched balance fetch failed, falling back", e);
    }
  }

  const [ton, jetton] = await Promise.all([
    getTonBalance(address, options).catch(() => new Decimal(0)),
    isNativeJetton(jettonAddress)
      ? new Decimal(0)
      : getJettonBalance(jettonAddress, address, options).catch(
          () => new Decimal(0),
        ),
  ]);

  return { ton, jetton };
}

/** Whether an Auto account matches a search term */
export function searchAutoAccount(account, searchTerm) {
  if (account.userId?.toString().toLowerCase().includes(searchTerm))
    return true;
  if (account.title?.toLowerCase().includes(searchTerm)) return true;
  if (account.address?.toLowerCase().includes(searchTerm)) return true;

  return false;
}
