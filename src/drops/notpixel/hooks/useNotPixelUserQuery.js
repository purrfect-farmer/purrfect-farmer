import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useNotPixelUserQuery() {
  const { api } = useFarmerContext();

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
