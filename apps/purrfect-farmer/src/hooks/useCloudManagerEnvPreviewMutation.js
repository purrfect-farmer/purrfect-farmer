import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useCloudManagerEnvPreviewMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["app", "cloud", "manager", "env", "preview"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/manager/env/preview", data)
        .then((res) => res.data),
  });
}
