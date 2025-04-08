import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureNewsMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "read-news"],
    mutationFn: () =>
      api
        .put("https://space-adventure.online/api/user/settings/read-news")
        .then((res) => res.data),
  });
}
