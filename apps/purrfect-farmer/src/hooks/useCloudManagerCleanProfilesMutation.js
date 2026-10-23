import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerCleanProfilesMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "clean-profiles"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/manager/clean-profiles", data)
        .then((res) => res.data),
  });
}
