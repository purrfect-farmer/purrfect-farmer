import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpGetFreeLootboxMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "lootbox", "get-free"],
    mutationFn: () => {
      return api
        .get("https://unijump.xyz/api/v1/lootboxes/get_free")
        .then((res) => res.data);
    },
  });
}
