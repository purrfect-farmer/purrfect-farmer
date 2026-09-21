import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerDeleteAllFarmersMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmers", "all", "delete"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/all/delete`, { id })
        .then((res) => res.data),
  });
}
