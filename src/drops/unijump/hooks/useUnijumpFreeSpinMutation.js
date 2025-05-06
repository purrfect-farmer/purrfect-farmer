import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useUnijumpFreeSpinMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["unijump", "spin", "free"],
    mutationFn: () => {
      return api
        .post("https://unijump.xyz/api/v1/fortune-wheel/free-spin", {})
        .then((res) => res.data);
    },
  });
}
