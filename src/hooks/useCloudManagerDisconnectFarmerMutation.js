import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerDisconnectFarmerMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmer", "disconnect"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/disconnect`, { id })
        .then((res) => res.data),
  });
}
