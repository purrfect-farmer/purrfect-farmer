import useAppContext from "./useAppContext";
import { useMutation } from "@tanstack/react-query";

export default function useCloudManagerExportBackupMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "backup", "export"],
    mutationFn: () =>
      cloudBackend.post("/api/manager/export-backup").then((res) => res.data),
  });
}
