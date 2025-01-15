import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useCEXChildrenQuery() {
  const { api, payload } = useFarmerContext();
  return useQuery({
    queryKey: ["cex", "children"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://app.cexptap.com/api/v2/getChildren",
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
