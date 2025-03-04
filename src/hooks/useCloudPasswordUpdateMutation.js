import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudPasswordUpdateMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["core", "cloud", "password", "update"],
    mutationFn: (data) =>
      cloudBackend.post("/api/update-password", data).then((res) => res.data),
  });
}
