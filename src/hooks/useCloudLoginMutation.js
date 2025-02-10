import { useMutation } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudLoginMutation() {
  const { cloudBackend } = useCloudContext();

  return useMutation({
    mutationKey: ["core", "cloud", "login"],
    mutationFn: (data) =>
      cloudBackend.post("/api/login", data).then((res) => res.data),
  });
}
