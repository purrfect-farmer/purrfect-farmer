import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpOpenLootboxMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "lootbox", "open"],
    mutationFn: (lootboxType) => {
      return api
        .post("https://unijump.xyz/api/v1/lootboxes/open", { lootboxType })
        .then((res) => res.data);
    },
  });
}
