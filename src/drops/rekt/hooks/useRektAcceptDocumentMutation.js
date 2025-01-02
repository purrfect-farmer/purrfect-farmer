import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export const DOCUMENT_TYPES = ["TERMS_OF_CONDITIONS", "PRIVACY_POLICY"];

export default function useRektAcceptDocumentMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["rekt", "document", "accept"],
    mutationFn: () =>
      Promise.all(
        DOCUMENT_TYPES.map((type) =>
          api
            .post(
              `https://rekt-mini-app.vercel.app/api/user/accept?documentType=${type}`,
              null
            )
            .then((res) => res.data)
        )
      ),
  });
}
