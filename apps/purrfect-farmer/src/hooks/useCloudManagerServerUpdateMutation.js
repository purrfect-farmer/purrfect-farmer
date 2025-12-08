import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerServerUpdateMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "server", "update"],
    mutationFn: () =>
      cloudBackend.post("/api/manager/update-server").then((res) => res.data),
  });
}
