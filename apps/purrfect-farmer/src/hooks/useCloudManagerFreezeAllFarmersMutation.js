import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerFreezeAllFarmersMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmers", "all", "freeze"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/all/freeze`, { id })
        .then((res) => res.data),
  });
}
