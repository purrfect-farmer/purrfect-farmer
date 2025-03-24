import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useTelegramCodeMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["app", "cloud", "telegram", "code"],
    mutationFn: (data) =>
      cloudBackend.post("/api/telegram/code", data).then((res) => res.data),
  });
}
