import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerRunFarmersMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmers", "run"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/manager/farmers/run`, { id })
        .then((res) => res.data),
  });
}
