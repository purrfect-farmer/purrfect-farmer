import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function usePumpadMissionsQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["pumpad", "missions", "list"],
    queryFn: ({ signal }) =>
      api
        .get("https://tg.pumpad.io/referral/api/v1/tg/missions", {
          signal,
        })
        .then((res) => res.data),
  });
}
