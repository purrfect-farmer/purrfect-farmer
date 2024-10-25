import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useNotPixelUserQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["notpixel", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://notpx.app/api/v1/users/me", {
          signal,
        })
        .then((res) => res.data),
  });
}
