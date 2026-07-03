import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerImportWhiskersMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "whiskers", "import"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/manager/import-whiskers", data)
        .then((res) => res.data),
  });
}
