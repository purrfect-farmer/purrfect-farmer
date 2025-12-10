import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerActivateFarmerMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmer", "activate"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/activate`, { id })
        .then((res) => res.data),
  });
}
