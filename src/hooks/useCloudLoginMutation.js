import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudLoginMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["core", "cloud", "login"],
    mutationFn: (data) =>
      cloudBackend.post("/api/login", data).then((res) => res.data),
  });
}
