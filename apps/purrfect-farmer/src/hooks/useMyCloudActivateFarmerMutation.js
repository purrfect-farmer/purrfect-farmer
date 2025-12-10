import { useMutation } from "@tanstack/react-query";

import useCloudQueryOptions from "./useCloudQueryOptions";

export default function useMyCloudActivateFarmerMutation() {
  const { auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useMutation({
    mutationKey: [
      "app",
      "cloud",
      "my-cloud",
      "farmer",
      "activate",
      cloudServer,
    ],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/farmers/activate`, { auth, id })
        .then((res) => res.data),
  });
}
