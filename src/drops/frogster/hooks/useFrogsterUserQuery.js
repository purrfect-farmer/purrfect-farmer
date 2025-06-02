import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useFrogsterUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["frogster", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://frogster.app/api/me", {
          signal,
        })
        .then((res) => res.data),
  });
}
