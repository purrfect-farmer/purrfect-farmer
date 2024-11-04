import useAppQuery from "@/hooks/useAppQuery";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function useNotPixelMiningStatusQuery() {
  const { api, isMutating } = useFarmerContext();

  return useAppQuery({
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
