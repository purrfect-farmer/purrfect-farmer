import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useSpaceAdventureBuyBoostMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["space-adventure", "boost", "buy"],
    mutationFn: (id) =>
      api
        .post("https://space-adventure.online/api/boost/buy/", {
          method: "free",
          id,
        })
        .then((res) => res.data),
  });
}
