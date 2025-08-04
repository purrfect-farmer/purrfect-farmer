import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useWontonUserQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["wonton", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://wonton.food/api/v1/user", {
          signal,
        })
        .then((res) => res.data),
  });
}
