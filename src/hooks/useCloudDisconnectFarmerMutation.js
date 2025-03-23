import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudDisconnectFarmerMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["core", "cloud", "farmer", "disconnect"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/farmers/${id}/disconnect`)
        .then((res) => res.data),
  });
}
