import { addDays } from "date-fns";
import db from "../db/models/index.js";

/** Days a subscription runs for when no end date is given */
export const DEFAULT_SUBSCRIPTION_DAYS = 30;

/** Create the account's active subscription, or move its end date */
export async function upsertSubscription(account, endsAt, transaction) {
  const subscription = account.subscriptions?.[0];

  if (subscription) {
    await subscription.update({ endsAt }, { transaction });
  } else {
    await account.createSubscription(
      { active: true, startsAt: new Date(), endsAt },
      { transaction },
    );
  }
}

/** Subscribe an account until `date`, or extend it by the default period */
export async function subscribeAccount(id, date, transaction) {
  const [account] = await db.Account.findOrCreate({
    where: { id },
    transaction,
    include: [
      {
        required: false,
        association: "subscriptions",
        where: { active: true },
      },
    ],
  });

  const current = account.subscription;
  const endsAt = date
    ? new Date(date)
    : addDays(
        current ? new Date(current.endsAt) : new Date(),
        DEFAULT_SUBSCRIPTION_DAYS,
      );

  await upsertSubscription(account, endsAt, transaction);
}
