import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureTutorialMutation() {
  const { api, getApiHeaders } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "tutorial"],
    mutationFn: async () =>
      api
        .put(
          "https://space-adventure.online/api/user/settings/tutorial/",
          null,
          {
            headers: await getApiHeaders(),
          }
        )
        .then((res) => res.data),
  });
}
