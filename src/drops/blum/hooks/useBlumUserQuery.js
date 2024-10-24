import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useBlumUserQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["blum", "user"],
    queryFn: ({ signal }) =>
      api
        .get("https://user-domain.blum.codes/api/v1/user/me", {
          signal,
        })
        .then((res) => res.data),
  });
}
