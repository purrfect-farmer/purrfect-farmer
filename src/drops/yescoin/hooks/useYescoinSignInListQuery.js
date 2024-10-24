import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinSignInListQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["yescoin", "sign-in", "list"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.gold/signIn/list", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
