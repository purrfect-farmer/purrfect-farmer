import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useMyCloudActivateFarmerMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "my-cloud", "farmer", "activate"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/farmers/activate`, { id })
        .then((res) => res.data),
  });
}
