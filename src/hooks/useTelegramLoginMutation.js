import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useTelegramLoginMutation(form) {
  const { settings, cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["core", "cloud", "telegram", "login"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/telegram/login", {
          ...data,
          api_id: settings.telegramApiId,
          api_hash: settings.telegramApiId,
        })
        .then((res) => res.data),
  });
}
