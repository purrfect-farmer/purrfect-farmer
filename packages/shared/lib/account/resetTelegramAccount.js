import { Api } from "telegram";

import {
  TELEGRAM_SERVICE_USER_ID,
  TELEGRAM_SPAM_BOT_ID,
} from "../../utils/telegram.js";

/** The steps of a reset, in the order they run */
export const RESET_STEP = Object.freeze({
  TWO_FA: "two-fa",
  UNBLOCK: "unblock",
  CHATS: "chats",
  CONTACTS: "contacts",
  SAVED_MESSAGES: "saved-messages",
});

/** The accounts a reset keeps */
const KEPT_IDS = new Set([TELEGRAM_SERVICE_USER_ID, TELEGRAM_SPAM_BOT_ID]);

/** Whether a dialog is removed by a reset */
const isRemovable = (dialog) =>
  !dialog.entity?.self && !KEPT_IDS.has(dialog.entity?.id?.toString());

/**
 * Reset a Telegram account: remove its 2FA, then every chat except Telegram and @SpamBot.
 *
 * @param {import("../BaseTelegramWebClient.js").default} client
 */
export default async function resetTelegramAccount(
  client,
  {
    password = "",
    block = false,
    deleteContacts = false,
    clearSavedMessages = false,
    unblockAll = false,
  } = {},
  onProgress = () => {},
) {
  /** Remove the 2FA */
  onProgress({ step: RESET_STEP.TWO_FA, done: 0, total: 1 });
  const passwordState = await client.getPasswordState();

  if (passwordState.hasPassword) {
    if (!password) throw new Error("2FA password is required");
    await client.updateTwoFa({ currentPassword: password });
  }

  /** Unblock everyone */
  if (unblockAll) {
    onProgress({ step: RESET_STEP.UNBLOCK, done: 0, total: 1 });
    await client.unblockAll();
  }

  /** Remove the chats one by one, a failure moving on to the next */
  const dialogs = (await client.execute(() => client.getDialogs({}))).filter(
    isRemovable,
  );
  let removed = 0;
  let failed = 0;

  for (const [index, dialog] of dialogs.entries()) {
    onProgress({ step: RESET_STEP.CHATS, done: index, total: dialogs.length });

    try {
      await client.removeDialog(dialog, { block });
      removed++;
    } catch (error) {
      console.error("Failed to remove dialog:", dialog.title, error);
      failed++;
    }
  }

  /** Delete the contacts */
  if (deleteContacts) {
    onProgress({ step: RESET_STEP.CONTACTS, done: 0, total: 1 });
    await client.deleteAllContacts();
  }

  /** Clear Saved Messages */
  if (clearSavedMessages) {
    onProgress({ step: RESET_STEP.SAVED_MESSAGES, done: 0, total: 1 });
    await client.deleteHistory(new Api.InputPeerSelf());
  }

  return { removed, failed };
}
