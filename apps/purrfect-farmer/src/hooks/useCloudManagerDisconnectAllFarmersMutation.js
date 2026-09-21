import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerDisconnectAllFarmersMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmers", "all", "disconnect"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/all/disconnect`, { id })
        .then((res) => res.data),
  });
}
