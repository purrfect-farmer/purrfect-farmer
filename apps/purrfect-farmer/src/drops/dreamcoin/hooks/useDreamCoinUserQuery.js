import useAppQuery from "@/hooks/useAppQuery";
import useFarmerApi from "@/hooks/useFarmerApi";

export default function useDreamCoinUserQuery() {
  const api = useFarmerApi();
  return useAppQuery({
    queryKey: ["dreamcoin", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://api.dreamcoin.ai/Users/current", {
          signal,
        })
        .then((res) => res.data),
  });
}
