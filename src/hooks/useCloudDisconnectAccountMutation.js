import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudDisconnectAccountMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["core", "cloud", "account", "disconnect"],
    mutationFn: (id) =>
      cloudBackend
        .post(`/api/accounts/${id}/disconnect`)
        .then((res) => res.data),
  });
}
