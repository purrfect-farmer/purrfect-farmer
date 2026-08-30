import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

export default function useMyCloudDeleteFarmerMutation() {
  const { auth, cloudBackend, cloudServer } = useCloudQueryOptions();

  return useMutation({
    mutationKey: ["app", "cloud", "my-cloud", "farmer", "delete", cloudServer],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/farmers/delete`, { auth, id })
        .then((res) => res.data),
  });
}
