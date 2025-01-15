import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useCEXUserQuery() {
  const { api, payload } = useFarmerContext();
  return useQuery({
    queryKey: ["cex", "user"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://app.cexptap.com/api/v2/getUserInfo",
          {
            ...payload,
            data: {},
          },
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
