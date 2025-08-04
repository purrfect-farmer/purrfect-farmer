import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerLoginMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "login"],
    mutationFn: (data) =>
      cloudBackend.post("/api/manager/login", data).then((res) => res.data),
  });
}
