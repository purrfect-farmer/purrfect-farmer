import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function usePaymentVerificationMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "payments", "verify"],
    mutationFn: (data) =>
      cloudBackend.post("/api/payments/verify", data).then((res) => res.data),
  });
}
