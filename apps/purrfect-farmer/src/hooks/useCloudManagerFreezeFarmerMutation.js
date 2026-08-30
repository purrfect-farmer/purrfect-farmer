import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerFreezeFarmerMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmer", "freeze"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/freeze`, { id })
        .then((res) => res.data),
  });
}
