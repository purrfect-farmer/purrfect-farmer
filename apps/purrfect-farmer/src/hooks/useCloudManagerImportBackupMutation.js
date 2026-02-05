import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerImportBackupMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "backup", "import"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/manager/import-backup", data)
        .then((res) => res.data),
  });
}
