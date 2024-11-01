import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useAgent301CardsQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["agent301", "cards"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api.agent301.org/cards/load",
          {},
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
