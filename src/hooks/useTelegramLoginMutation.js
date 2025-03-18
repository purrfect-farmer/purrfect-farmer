import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useTelegramLoginMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["core", "cloud", "telegram", "login"],
    mutationFn: (data) =>
      cloudBackend.post("/api/telegram/login", data).then((res) => res.data),
  });
}
