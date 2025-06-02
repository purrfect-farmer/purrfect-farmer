import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMetaLottUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["meta-lott", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://www.metalott.com/core/app/user/getUserInfo", {
          signal,
        })
        .then((res) => res.data.result),
  });
}
