import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useHrumOpenMutation() {
  const { api } = useFarmerContext();

  return useMutation({
    mutationKey: ["hrum", "open"],
    mutationFn: () => {
      return api
        .post("https://api.hrum.me/user/cookie/open", {})
        .then((res) => res.data.data);
    },
  });
}
