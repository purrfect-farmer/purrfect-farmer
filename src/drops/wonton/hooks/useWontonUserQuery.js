import useFarmerApi from "@/hooks/useFarmerApi";
import { useIsMutating, useQuery } from "@tanstack/react-query";

export default function useWontonUserQuery() {
  const api = useFarmerApi();
  const isMutating = useIsMutating({ mutationKey: ["wonton"] });

  return useQuery({
    refetchInterval: isMutating < 1 ? 10000 : false,
    queryKey: ["wonton", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://wonton.food/api/v1/user", {
          signal,
        })
        .then((res) => res.data),
  });
}
