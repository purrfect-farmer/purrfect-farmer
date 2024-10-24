import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinWalletQuery() {
  const api = useFarmerApi();
  return useQuery({
    queryKey: ["yescoin", "wallet"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.gold/wallet/getWallet", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
