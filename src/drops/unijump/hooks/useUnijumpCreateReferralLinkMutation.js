import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpCreateReferralLinkMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "referral-link", "create"],
    mutationFn: () => {
      return api
        .post("https://unijump.xyz/api/v1/referral/link/create", {})
        .then((res) => res.data);
    },
  });
}
