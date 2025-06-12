import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useNeubeatUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["neubeat", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.audiera.fi/api/loginUser", {
          signal,
        })
        .then((res) => res.data),
  });
}
