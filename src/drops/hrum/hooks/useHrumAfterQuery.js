import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useHrumAfterQuery() {
  const { api } = useFarmerContext();

  return useQuery({
    queryKey: ["hrum", "after"],
    queryFn: ({ signal }) => {
      return api
        .post(
          "https://api.hrum.me/user/data/after",
          { lang: "en" },
          {
            signal,
          }
        )
        .then((res) => res.data.data);
    },
  });
}
