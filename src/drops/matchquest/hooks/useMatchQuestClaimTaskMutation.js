import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

import useMatchQuestUid from "./useMatchQuestUid";

export default function useMatchQuestClaimTaskMutation() {
  const api = useFarmerApi();
  const uid = useMatchQuestUid();

  return useMutation({
    mutationKey: ["matchquest", "task", "claim"],
    mutationFn: (type) =>
      api
        .post(
          "https://tgapp-api.matchain.io/api/tgapp/v1/point/task/claim",
          Object.assign(
            {
              type,
              uid,
            },
            type === "create_dmail_account"
              ? {
                  ["dmail_wallet_addr"]: "1",
                  ["dmail_addr"]: "1",
                  ["dmail_id"]: "1",
                  ["dmail_nft"]: "1",
                }
              : {}
          )
        )
        .then((res) => res.data.data),
  });
}
