import useFarmerContext from "@/hooks/useFarmerContext";
import { useMutation } from "@tanstack/react-query";

export default function useNotPixelRepaintMutation() {
  const { api } = useFarmerContext();
  return useMutation({
    mutationKey: ["notpixel", "repaint"],
    mutationFn: (data = { newColor: null, pixelId: null }) =>
      api
        .post("https://notpx.app/api/v1/repaint/start", data)
        .then((res) => res.data),
  });
}
