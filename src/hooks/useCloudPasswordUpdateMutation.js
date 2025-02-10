import { useMutation } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudPasswordUpdateMutation() {
  const { cloudBackend } = useCloudContext();

  return useMutation({
    mutationKey: ["core", "cloud", "password", "update"],
    mutationFn: (data) =>
      cloudBackend.post("/api/update-password", data).then((res) => res.data),
  });
}
