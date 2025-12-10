import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useMyCloudDeactivateFarmerMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "my-cloud", "farmer", "deactivate"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/farmers/deactivate`, { id })
        .then((res) => res.data),
  });
}
