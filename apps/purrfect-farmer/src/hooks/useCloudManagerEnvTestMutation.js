import { useMutation } from "@tanstack/react-query";

import useAppContext from "./useAppContext";

export default function useCloudManagerEnvTestMutation() {
  const { cloudBackend } = useAppContext();

  return useMutation({
    mutationKey: ["app", "cloud", "manager", "env", "test"],
    mutationFn: ({ service, values }) =>
      cloudBackend
        .post(`/api/manager/env/test/${service}`, { values })
        .then((res) => res.data.results),
  });
}
