import { Address, SendMode, internal, toNano } from "@ton/core";
import {
  JETTON_TRANSFER_GAS,
  buildJettonTransferBody,
  waitForSeqnoChange,
} from "../ton/transactions.js";
import { prepareMaster } from "./transactions.js";

/** Send an exact amount of TON (jettonAddress null) or a jetton from any Auto wallet
 * @param {object} wallet - { address, version, phrase, tonCenterApiKey? }
 * @param {object} options - { to, jettonAddress, amount }
 */
export async function sendFromWallet(wallet, { to, jettonAddress, amount }) {
  const { contract, keyPair, jettonWalletAddress, jettonDecimals } =
    await prepareMaster(wallet, jettonAddress);

  let message;

  if (jettonAddress) {
    /* The jetton wallet is paid for by the sender's TON */
    const tonBalance = await contract.getBalance();

    if (tonBalance < JETTON_TRANSFER_GAS) {
      throw new Error("Not enough TON in the wallet to pay the jetton gas");
    }

    message = internal({
      to: jettonWalletAddress,
      value: JETTON_TRANSFER_GAS,
      body: buildJettonTransferBody(
        jettonDecimals,
        amount,
        to,
        wallet.address,
      ),
    });
  } else {
    message = internal({
      to: Address.parse(to),
      value: toNano(String(amount)),
      bounce: false,
    });
  }

  const seqno = await contract.getSeqno();

  await contract.sendTransfer({
    seqno,
    secretKey: keyPair.secretKey,
    sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
    messages: [message],
  });

  await waitForSeqnoChange(contract, seqno);
}
