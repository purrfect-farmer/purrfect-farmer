import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useCloudManagerPasswordUpdateMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["app", "cloud", "manager", "password", "update"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/manager/update-password", data)
        .then((res) => res.data),
  });
}
