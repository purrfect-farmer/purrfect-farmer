import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useAgent301WheelQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["agent301", "wheel"],
    queryFn: ({ signal }) =>
      api
        .post("https://api.agent301.org/wheel/load", null, {
          signal,
        })
        .then((res) => res.data),
  });
}
