import useFarmerApi from "@/hooks/useFarmerApi";
import { useMutation } from "@tanstack/react-query";

export default function useNeubeatGenderMutation() {
  const api = useFarmerApi();
  return useMutation({
    mutationKey: ["neubeat", "gender"],
    mutationFn: (gender) =>
      api
        .post("https://tg.audiera.fi/api/setGender", { gender })
        .then((res) => res.data),
  });
}
