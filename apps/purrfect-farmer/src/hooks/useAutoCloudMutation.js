import useAuto from "./useAuto";
import useCloudQueryOptions from "./useCloudQueryOptions";
import { useMutation } from "@tanstack/react-query";

/**
 * Dispatches an Auto operation to the Cloud for the current drop.
 *
 * The server replies immediately and reports progress over the Telegram bot,
 * so the mutation resolves as soon as the operation is accepted.
 */
export default function useAutoCloudMutation(operation) {
  const { config } = useAuto();
  const { auth, cloudBackend } = useCloudQueryOptions();

  return useMutation({
    mutationKey: [config.id, "cloud", operation],
    mutationFn: (data) =>
      cloudBackend
        .post(`/api/auto/${config.id}/${operation}`, { auth, ...data })
        .then((res) => res.data),
  });
}
