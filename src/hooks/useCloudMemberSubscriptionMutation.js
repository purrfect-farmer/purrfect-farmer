import useAppContext from "./useAppContext";
import useFormMutation from "./useFormMutation";

export default function useCloudMemberSubscriptionMutation(form) {
  const { cloudBackend } = useAppContext();

  return useFormMutation(form, {
    mutationKey: ["app", "cloud", "member", "subscription"],
    mutationFn: (data) =>
      cloudBackend
        .post("/api/members/subscription", data)
        .then((res) => res.data),
  });
}
