import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudKickAccountMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["core", "cloud", "account", "kick"],
    mutationFn: (id) =>
      cloudBackend.post(`/api/accounts/${id}/kick`).then((res) => res.data),
  });
}
