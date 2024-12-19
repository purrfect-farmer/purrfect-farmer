import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useTsubasaEnergyLevelUpMutation() {
  const { api, initData } = useFarmerContext();
  return useMutation({
    mutationKey: ["tsubasa", "energy", "level-up"],
    mutationFn: () =>
      api
        .post("https://api.app.ton.tsubasa-rivals.com/api/energy/levelup", {
          initData,
        })
        .then((res) => res.data),
  });
}
