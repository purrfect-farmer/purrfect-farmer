import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerDeleteFarmerMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmer", "delete"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/delete`, { id })
        .then((res) => res.data),
  });
}
