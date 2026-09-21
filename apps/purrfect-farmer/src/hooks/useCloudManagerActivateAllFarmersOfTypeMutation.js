import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerActivateAllFarmersOfTypeMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: [
      "app",
      "cloud",
      "manager",
      "farmers",
      "all",
      "activate",
      "type",
    ],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/all/activate`, { id })
        .then((res) => res.data),
  });
}
