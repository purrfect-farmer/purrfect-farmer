import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerMemberFarmingMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "member", "farming"],
    mutationFn: ({ id, farming }) =>
      cloudBackend
        .post(`/api/manager/members/farming`, { id: String(id), farming })
        .then((res) => res.data),
  });
}
