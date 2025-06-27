import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureNewsMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "read-news"],
    mutationFn: async () =>
      api
        .put(
          "https://space-adventure.online/api/user/settings/read-news",
          null,
          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
