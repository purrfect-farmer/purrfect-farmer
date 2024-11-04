import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadAssetsQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["pumpad", "assets", "list"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/lottery/assets", {
          signal,
        })
        .then((res) => res.data),
  });
}
