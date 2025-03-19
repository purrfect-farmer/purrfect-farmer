import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useTelegramCodeMutation(form) {
  const { settings, cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["core", "cloud", "telegram", "code"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/telegram/code", {
          ...data,
          api_id: settings.telegramApiId,
          api_hash: settings.telegramApiHash,
        })
        .then((res) => res.data),
  });
}
