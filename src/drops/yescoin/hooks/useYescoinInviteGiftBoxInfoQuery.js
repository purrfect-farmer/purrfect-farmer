import useFarmerApi from "@/hooks/useFarmerApi";
import { useQuery } from "@tanstack/react-query";

export default function useYescoinInviteGiftBoxInfoQuery() {
  const api = useFarmerApi();

  return useQuery({
    queryKey: ["yescoin", "invite", "gift-box", "info"],
    queryFn: ({ signal }) =>
      api
        .get("https://api-backend.yescoin.fun/invite/getInviteGiftBoxInfo", {
          signal,
        })
        .then((res) => res.data.data),
  });
}
