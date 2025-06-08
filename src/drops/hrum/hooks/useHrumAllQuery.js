import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useHrumAllQuery() {
  const { api } = useFarmerContext();

  return useQuery({
    queryKey: ["hrum", "all"],
    queryFn: ({ signal }) => {
      return api
        .post(
          "https://api.hrum.me/user/data/all",
          {},
          {
            signal,
          }
        )
        .then((res) => res.data.data);
    },
  });
}
