import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureGetAdsMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "ads", "get"],
    mutationFn: async (type) =>
      api
        .post(
          "https://space-adventure.online/api/user/get_ads/",
          {
            type,
          },
          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
