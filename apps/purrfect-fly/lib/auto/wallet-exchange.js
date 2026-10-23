import { generateMnemonicPhrase } from "@purrfect/shared/lib/ton/wallet.js";
import logger from "../logger.js";
import { skippedWithdrawal } from "./summary.js";

/** Withdraw a requester's pool through a helper account, passing the wallet along and putting it back */
export async function withdrawThroughHelper(
  ctx,
  { requester, requesterRunner, helper, helperRunner },
) {
  const { wallet } = ctx;

  /** Never take a wallet from an account that is already mid-exchange */
  if (!ctx.helpers.holdsOwnWallet(requesterRunner, requester)) {
    return skippedWithdrawal(
      "Not on its own wallet - is it loaded on another server?",
    );
  }

  /** Both phrases are decrypted up front, because a rollback needs them and nothing has moved yet */
  const [requesterPhrase, helperPhrase, temporaryPhrase] = await Promise.all([
    ctx.decryptPhrase(requester.encryptedPhrase),
    ctx.decryptPhrase(helper.encryptedPhrase),
    generateMnemonicPhrase(),
  ]);

  const connect = (runner, phrase, version, label) =>
    wallet.connectOrThrow(runner, { phrase, version }, `${label} failed`);

  let requesterMoved = false;
  let helperMoved = false;

  /** Best-effort return of both accounts to their own wallets */
  const rollback = async () => {
    if (helperMoved) {
      try {
        await connect(
          helperRunner,
          helperPhrase,
          helper.version,
          "helper restore",
        );
        helperMoved = false;
      } catch (error) {
        logger.error("Failed to restore helper wallet:", error.message);
      }
    }

    if (requesterMoved) {
      try {
        await connect(
          requesterRunner,
          requesterPhrase,
          requester.version,
          "requester restore",
        );
        requesterMoved = false;
      } catch (error) {
        logger.error("Failed to restore requester wallet:", error.message);
      }
    }

    return { requesterMoved, helperMoved };
  };

  try {
    /** The requester releases its wallet */
    await connect(
      requesterRunner,
      temporaryPhrase,
      requester.version,
      "requester park",
    );
    requesterMoved = true;

    /** The verified account picks it up */
    await connect(
      helperRunner,
      requesterPhrase,
      requester.version,
      "helper adopt",
    );
    helperMoved = true;

    /** A refusal here is an outcome, not a fault: restore both wallets the ordinary way and report it */
    const withdrawal = await helperRunner.withdraw({
      force: true,
      difference: 0,
    });

    await connect(helperRunner, helperPhrase, helper.version, "helper restore");
    helperMoved = false;

    await connect(
      requesterRunner,
      requesterPhrase,
      requester.version,
      "requester restore",
    );
    requesterMoved = false;

    /** Keep the next cycle from re-picking an account just drained */
    await requesterRunner.storeAutoSnapshot();

    return withdrawal;
  } catch (error) {
    const stranded = await rollback();

    if (stranded.requesterMoved || stranded.helperMoved) {
      await ctx.notify.sendStrandedWallet({
        requester,
        helper,
        ...stranded,
      });
    }

    throw error;
  }
}
