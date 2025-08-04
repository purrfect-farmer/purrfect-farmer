import useFarmerContext from "@/hooks/useFarmerContext";
import { useQuery } from "@tanstack/react-query";

export default function useTomarketInviteCodeQuery() {
  const { api } = useFarmerContext();
  return useQuery({
    queryKey: ["tomarket", "invite-code"],
    queryFn: ({ signal }) =>
      api
        .post(
          "https://api-web.tomarket.ai/tomarket-game/v1/user/inviteCode",
          null,
          {
            signal,
          }
        )
        .then((res) => res.data.data),
  });
}
