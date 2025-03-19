import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useTelegramPasswordMutation(form) {
  const { settings, cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["core", "cloud", "telegram", "password"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/telegram/password", {
          ...data,
          api_id: settings.telegramApiId,
          api_hash: settings.telegramApiId,
        })
        .then((res) => res.data),
  });
}
