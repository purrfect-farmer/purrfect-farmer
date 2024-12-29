import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMidasUserQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["midas", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-tg-app.midas.app/api/user", {
          signal,
        })
        .then((res) => res.data),
  });
}
