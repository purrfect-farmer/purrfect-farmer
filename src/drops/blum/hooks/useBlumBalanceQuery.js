import useAppQuery from "@/hooks/useAppQuery";
import useFarmerContext from "@/hooks/useFarmerContext";

export default function useBlumBalanceQuery() {
  const { api } = useFarmerContext();

  return useAppQuery({
    queryKey: ["blum", "balance"],
    queryFn: ({ signal }) =>
      api
        .get("https://game-domain.blum.codes/api/v1/user/balance", {
          signal,
        })
        .then((res) => res.data),
  });
}
