import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useDiggerUserQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["digger", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.diggergame.app/api/me", {
          signal,
        })
        .then((res) => res.data.result),
  });
}
