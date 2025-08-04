import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useWontonShopQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["wonton", "shop"],
    queryFn: ({ signal }) =>
      api
        .get("https://wonton.food/api/v1/shop/list", {
          signal,
        })
        .then((res) => res.data),
  });
}
