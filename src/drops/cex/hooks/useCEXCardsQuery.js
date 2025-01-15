import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useCEXCardsQuery() {
  const { api, payload } = useFarmerContext();
  return useQuery({
    queryKey: ["cex", "user-cards"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://app.cexptap.com/api/v2/getUserCards",
          {
            ...payload,
            data: {},
          },
          {
            signal,
          }
        )
        .then((res) => res.data),
  });
}
