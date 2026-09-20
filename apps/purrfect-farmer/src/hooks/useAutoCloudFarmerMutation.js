import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

/** Changes the drop's farmer for one managed account on the Cloud */
export default function useAutoCloudFarmerMutation(action) {
  const { config } = useAuto();
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: [config.id, "cloud", "farmer", action],
    mutationFn: (data) =>
      cloudBackend
        .post(`/api/auto/${config.id}/farmer/${action}`, { auth, ...data })
        .then((res) => res.data),
  });
}
