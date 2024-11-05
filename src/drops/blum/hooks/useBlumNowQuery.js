import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useBlumNowQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["blum", "now"],
    queryFn: ({ signal }) =>
      api
        .get("https://game-domain.blum.codes/api/v1/time/now", {
          signal,
        })
        .then((res) => res.data),
  });
}
