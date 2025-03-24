import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function usePaymentInitializationMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["app", "cloud", "payments", "initialize"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/payments/initialize", data)
        .then((res) => res.data),
  });
}
