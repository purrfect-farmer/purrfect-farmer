import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["pumpad", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/tg/user/information", {
          signal,
        })
        .then((res) => res.data),
  });
}
