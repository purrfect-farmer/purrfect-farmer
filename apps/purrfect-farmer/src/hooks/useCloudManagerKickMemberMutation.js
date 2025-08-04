import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerKickMemberMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "member", "kick"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/members/kick`, { id })
        .then((res) => res.data),
  });
}
