import { fetchWhiskersAccounts } from "@/lib/whiskersAccounts";
import useAuto from "./useAuto";
import { useMutation } from "@tanstack/react-query";

/** A hook for renaming this drop's accounts to their Whiskers titles, matched by Telegram user id */
export default function useAutoWhiskersResyncMutation() {
  const { config, accounts, storeAccounts } = useAuto();

  return useMutation({
    mutationKey: [config.id, "whiskers-resync"],
    mutationFn: async () => {
      /** The Telegram user ids of the accounts that have one */
      const userIds = [
        ...new Set(
          accounts
            .map((account) => account.userId)
            .filter((userId) => userId !== undefined && userId !== null)
            .map(String),
        ),
      ];

      if (!userIds.length) {
        throw new Error("No accounts with a Telegram user id.");
      }

      const whiskersAccounts = await fetchWhiskersAccounts(userIds);

      /** The Whiskers title of each Telegram user id */
      const titles = new Map(
        whiskersAccounts.map((item) => [String(item.userId), item.title]),
      );

      let updated = 0;

      const renamed = accounts.map((account) => {
        const title = titles.get(String(account.userId));

        if (!title || title === account.title) return account;

        updated += 1;

        return { ...account, title };
      });

      if (updated) storeAccounts(renamed);

      return { updated, missing: userIds.length - titles.size };
    },
  });
}
