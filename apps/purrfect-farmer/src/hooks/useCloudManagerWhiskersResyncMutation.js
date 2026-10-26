import { useMutation, useQueryClient } from "@tanstack/react-query";

import { fetchWhiskersAccounts } from "@/lib/whiskersAccounts";
import { normalizeTitleUpdates } from "@purrfect/shared/lib/account/titles";
import useAppContext from "./useAppContext";

/** A hook for renaming the cloud server's members to their Whiskers titles */
export default function useCloudManagerWhiskersResyncMutation() {
  const { settings, cloudBackend } = useAppContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "members", "whiskers-resync"],
    mutationFn: async () => {
      /** The members, fetched fresh from the server */
      const members = await cloudBackend
        .get("/api/manager/members")
        .then((res) => res.data);
      const ids = members.map((member) => member.id);

      if (!ids.length) {
        throw new Error("The server has no members.");
      }

      const whiskersAccounts = await fetchWhiskersAccounts(ids);

      /** The Whiskers title of each member, checked by the server's rule */
      const titles = [
        ...normalizeTitleUpdates(
          whiskersAccounts.map((account) => ({
            id: account.userId,
            title: account.title,
          })),
        ),
      ].map(([id, title]) => ({ id, title }));

      const { updated } = titles.length
        ? await cloudBackend
            .post("/api/manager/members/titles", { titles })
            .then((res) => res.data)
        : { updated: 0 };

      /** Refresh the member list on screen */
      await queryClient.invalidateQueries({
        queryKey: ["app", "cloud", "manager", "members", settings.cloudServer],
      });

      return { updated, missing: ids.length - titles.length };
    },
  });
}
