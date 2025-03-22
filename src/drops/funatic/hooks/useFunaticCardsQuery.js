import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFunaticCardsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["funatic", "cards"],
    queryFn: ({ signal }) =>
      api
        .get("https://api2.funtico.com/api/lucky-funatic/cards", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
