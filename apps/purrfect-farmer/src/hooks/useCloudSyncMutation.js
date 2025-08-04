import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudSyncMutation(id, client) {
  const { cloudBackend } = useAppContext();

  return useMutation(
    {
      mutationKey: ["app", "cloud", "sync", id],
      mutationFn: (data) =>
        cloudBackend.post("/api/sync", data).then((res) => res.data),
    },
    client
  );
}
