import { useMutation } from "@tanstack/react-query";

import useCloudQueryOptions from "./useCloudQueryOptions";

export default function useMyCloudDeactivateFarmerMutation() {
  const { auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useMutation({
    mutationKey: [
      "app",
      "cloud",
      "my-cloud",
      "farmer",
      "deactivate",
      cloudServer,
    ],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/farmers/deactivate`, { auth, id })
        .then((res) => res.data),
  });
}
