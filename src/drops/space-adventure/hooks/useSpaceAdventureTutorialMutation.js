import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureTutorialMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "tutorial"],
    mutationFn: () =>
      api
        .put("https://space-adventure.online/api/user/settings/tutorial/")
        .then((res) => res.data),
  });
}
