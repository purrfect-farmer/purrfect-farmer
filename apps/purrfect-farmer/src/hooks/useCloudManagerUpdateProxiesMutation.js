import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerUpdateProxiesMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "proxies", "update"],
    mutationFn: () =>
      cloudBackend.post("/api/manager/update-proxies").then((res) => res.data),
  });
}
