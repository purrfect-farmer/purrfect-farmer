import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useRektUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["rekt", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://rekt-mini-app.vercel.app/api/user/me", {
          signal,
        })
        .then((res) => res.data),
  });
}
