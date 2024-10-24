import useFarmerApi from "@/hooks/useFarmerApi";
import { useIsMutating, useQuery } from "@tanstack/react-query";

export default function useNotPixelMiningStatusQuery() {
  const api = useFarmerApi();
  const isMutating = useIsMutating({ mutationKey: ["notpixel"] });

  return useQuery({
    refetchInterval: isMutating < 1 ? 10_000 : false,
    queryKey: ["notpixel", "mining", "status"],
    queryFn: ({ signal }) =>
      api
        .get("https://notpx.app/api/v1/mining/status", {
          signal,
        })
        .then((res) => res.data),
  });
}
