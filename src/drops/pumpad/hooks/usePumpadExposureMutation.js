import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function usePumpadExposureMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["pumpad", "exposure"],
    mutationFn: ({ event, source }) =>
      api
        .post("https://tg.pumpad.io/referral/api/v1/exposures", {
          ["ad_event"]: event,
          ["ad_source"]: source,
          ["page_type"]: "MEMBER_PAGE",
        })
        .then((res) => res.data),
  });
}
