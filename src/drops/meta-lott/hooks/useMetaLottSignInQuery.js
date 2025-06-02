import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useMetaLottSignInQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["meta-lott", "sign-in"],
    queryFn: ({ signal }) =>
      api
        .post("https://www.metalott.com/core/app/signIn/signStatus", {
          signal,
        })
        .then((res) => res.data.result),
  });
}
