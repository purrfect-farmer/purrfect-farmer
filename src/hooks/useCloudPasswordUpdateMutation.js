import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useCloudPasswordUpdateMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["app", "cloud", "password", "update"],
    mutationFn: (data) =>
      cloudBackend.post("/api/update-password", data).then((res) => res.data),
  });
}
