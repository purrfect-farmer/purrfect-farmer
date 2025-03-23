import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudKickMemberMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["core", "cloud", "member", "kick"],
    mutationFn: (id) =>
      cloudBackend.post(`/api/members/${id}/kick`).then((res) => res.data),
  });
}
