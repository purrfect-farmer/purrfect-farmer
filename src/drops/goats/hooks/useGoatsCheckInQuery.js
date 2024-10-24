import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useGoatsCheckInQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["goats", "check-in"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-checkin.goatsbot.xyz/checkin/user", {
          signal,
        })
        .then((res) => res.data),
  });
}
