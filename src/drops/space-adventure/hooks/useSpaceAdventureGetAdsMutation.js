import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureGetAdsMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "ads", "get"],
    mutationFn: (type) =>
      api
        .post("https://space-adventure.online/api/user/get_ads/", {
          type,
        })
        .then((res) => res.data),
  });
}
