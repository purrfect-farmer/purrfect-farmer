import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useCloudManagerEnvMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["app", "cloud", "manager", "env", "update"],
    mutationFn: (data) =>
      cloudBackend.post("/api/manager/env", data).then((res) => res.data),
  });
}
