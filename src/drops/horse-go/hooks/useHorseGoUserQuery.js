import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useHorseGoUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["horse-go", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.horsego.vip/user_api/user_data", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
