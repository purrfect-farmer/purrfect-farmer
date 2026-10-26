import { Address, Cell } from "@ton/core";
import Decimal from "decimal.js";

/** Send a TonConnect `sendTransaction` request from a wallet, checking it can be afforded, and return the TON it paid
 * @param {import("../../wallets/TonWallet.js").default} wallet
 * @param {{ messages?: { address: string, amount: string, payload?: string }[] }} transaction
 * @param {{ gasTon: number, signal?: AbortSignal, onSent?: () => Promise<void> }} options
 * @returns {Promise<Decimal>}
 */
export async function sendTonConnectTransaction(
  wallet,
  transaction,
  { gasTon, signal, onSent },
) {
  const messages = transaction?.["messages"] || [];

  if (!messages.length) {
    throw new Error("The order carries no transaction");
  }

  const total = messages.reduce(
    (sum, message) => sum + BigInt(message["amount"]),
    0n,
  );
  const totalTon = new Decimal(total.toString()).div(1e9);
  const balance = await wallet
    .getBalance({ signal })
    .catch(() => new Decimal(0));

  if (balance.lessThan(totalTon.plus(gasTon))) {
    throw new Error(
      `Needs ${totalTon.plus(gasTon)} TON, the wallet holds ${balance}`,
    );
  }

  const seqno = await wallet.send(
    messages.map((message) => ({
      to: Address.parse(message["address"]),
      value: BigInt(message["amount"]),
      body: message["payload"]
        ? Cell.fromBase64(message["payload"])
        : undefined,
    })),
  );

  await onSent?.();
  await wallet.waitForConfirmation(seqno);

  return totalTon;
}
