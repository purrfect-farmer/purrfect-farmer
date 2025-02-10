import { useMutation } from "@tanstack/react-query";

import useCloudContext from "./useCloudContext";

export default function useCloudDisconnectAccountMutation() {
  const { cloudBackend } = useCloudContext();

  return useMutation({
    mutationKey: ["core", "cloud", "account", "disconnect"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/accounts/${id}/disconnect`)
        .then((res) => res.data),
  });
}
