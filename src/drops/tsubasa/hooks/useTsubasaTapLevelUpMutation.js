import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useTsubasaTapLevelUpMutation() {
  const { api, initData } = useFarmerContext();
  return useMutation({
    mutationKey: ["tsubasa", "tap", "level-up"],
    mutationFn: () =>
      api
        .post("https://api.app.ton.tsubasa-rivals.com/api/tap/levelup", {
          initData,
        })
        .then((res) => res.data),
  });
}
