import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerActivateAllFarmersMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "farmers", "all", "activate"],
    mutationFn: () =>
      cloudBackend
        .post("/api/manager/farmers/all/activate")
        .then((res) => res.data),
  });
}
