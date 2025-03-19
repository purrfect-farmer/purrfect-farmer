import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useTelegramPasswordMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["core", "cloud", "telegram", "password"],
    mutationFn: (data) =>
      cloudBackend.post("/api/telegram/password", data).then((res) => res.data),
  });
}
