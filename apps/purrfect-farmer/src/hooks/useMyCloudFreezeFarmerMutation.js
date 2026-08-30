import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useMyCloudFreezeFarmerMutation() {
  const { auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useMutation({
    mutationKey: ["app", "cloud", "my-cloud", "farmer", "freeze", cloudServer],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/farmers/freeze`, { auth, id })
        .then((res) => res.data),
  });
}
