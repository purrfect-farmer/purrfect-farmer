import useFarmerApi from "@/hooks/useFarmerApi";
import { useIsMutating, useQuery } from "@tanstack/react-query";

export default function useNotPixelUserQuery(options) {
  const api = useFarmerApi();
  const isMutating = useIsMutating({ mutationKey: ["notpixel"] });

  return useQuery({
    refetchInterval: isMutating < 1 ? 10_000 : false,
    queryKey: ["notpixel", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://notpx.app/api/v1/users/me", {
          signal,
        })
        .then((res) => res.data),
    ...options,
  });
}
